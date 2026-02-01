/**
 * Bridge Lyrics Module - Lyrics Service
 * Handles LRCLIB API integration and LRC conversion
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { EventEmitter } from 'eventemitter3'
import { LyricsSearchResult, LyricLine, LyricsDownloadProgress } from '../../../src-shared/interfaces/lyrics.interface.js'

interface LrcLyrics {
  lines: LyricLine[]
  artist?: string
  title?: string
  album?: string
  duration?: number
}

interface LyricsServiceEvents {
  lyricsProgress: (progress: LyricsDownloadProgress) => void
}

class LyricsService extends EventEmitter<LyricsServiceEvents> {
  private readonly LRCLIB_API = 'https://lrclib.net/api'

  /**
   * Search LRCLIB for lyrics
   */
  async searchLyrics(artist: string, title: string): Promise<LyricsSearchResult[]> {
    const query = encodeURIComponent(`${artist} ${title}`)
    const url = `${this.LRCLIB_API}/search?q=${query}`

    try {
      const response = await this.httpGet(url)
      const results = JSON.parse(response) as LyricsSearchResult[]
      
      // Filter to only include results with synced lyrics
      return results.filter(r => r.syncedLyrics && !r.instrumental)
    } catch (err) {
      console.error('LRCLIB search failed:', err)
      return []
    }
  }

  /**
   * Get lyrics by track details (exact match)
   */
  async getLyrics(artist: string, title: string, album?: string, duration?: number): Promise<LyricsSearchResult | null> {
    let url = `${this.LRCLIB_API}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    
    if (album) {
      url += `&album_name=${encodeURIComponent(album)}`
    }
    if (duration) {
      url += `&duration=${Math.round(duration)}`
    }

    try {
      const response = await this.httpGet(url)
      const result = JSON.parse(response) as LyricsSearchResult
      
      if (result.syncedLyrics) {
        return result
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Get lyrics by LRCLIB ID
   */
  async getLyricsById(id: number): Promise<LyricsSearchResult | null> {
    const url = `${this.LRCLIB_API}/get/${id}`

    try {
      const response = await this.httpGet(url)
      return JSON.parse(response) as LyricsSearchResult
    } catch {
      return null
    }
  }

  /**
   * Parse LRC format string into structured lyrics
   */
  parseLrc(lrcString: string): LrcLyrics {
    const lines: LyricLine[] = []
    const lrcLines = lrcString.split('\n')

    // LRC timestamp regex: [mm:ss.xx] or [mm:ss:xx]
    const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g

    for (const line of lrcLines) {
      const cleanLine = line.trim()
      if (!cleanLine) continue

      // Extract all timestamps from line
      const timestamps: number[] = []
      let match
      
      while ((match = timeRegex.exec(cleanLine)) !== null) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        let ms = parseInt(match[3], 10)
        
        // Handle both .xx (centiseconds) and .xxx (milliseconds)
        if (match[3].length === 2) {
          ms *= 10
        }
        
        const time = (minutes * 60 + seconds) * 1000 + ms
        timestamps.push(time)
      }

      // Get the text after all timestamps
      const text = cleanLine.replace(/\[\d{2}:\d{2}[.:]\d{2,3}\]/g, '').trim()

      // Create a line entry for each timestamp
      for (const time of timestamps) {
        if (text) {
          lines.push({ time, text })
        }
      }
    }

    // Sort by time
    lines.sort((a, b) => a.time - b.time)

    return { lines }
  }

  /**
   * Convert parsed lyrics to .chart event format
   * Returns lines to add to the [Events] section
   */
  lyricsToChartEvents(lyrics: LrcLyrics, resolution: number = 192, bpm: number = 120): string[] {
    const events: string[] = []
    
    // Calculate ticks per millisecond
    // resolution = ticks per quarter note
    // at 120 BPM, 1 quarter note = 500ms
    // ticks per ms = resolution / 500 = resolution * bpm / 60000
    const ticksPerMs = (resolution * bpm) / 60000

    let phraseStart = true

    for (let i = 0; i < lyrics.lines.length; i++) {
      const line = lyrics.lines[i]
      const tick = Math.round(line.time * ticksPerMs)

      // Add phrase_start at beginning of each line
      if (phraseStart) {
        events.push(`  ${tick} = E "phrase_start"`)
        phraseStart = false
      }

      // Add the lyric
      events.push(`  ${tick} = E "lyric ${line.text}"`)

      // Check if next line is far away (new phrase) or end of lyrics
      const nextLine = lyrics.lines[i + 1]
      if (!nextLine || (nextLine.time - line.time) > 3000) {
        // Add phrase_end after a gap
        const endTick = tick + Math.round(500 * ticksPerMs) // 500ms after lyric
        events.push(`  ${endTick} = E "phrase_end"`)
        phraseStart = true
      }
    }

    return events
  }

  /**
   * Inject lyrics into a .chart file
   */
  async injectLyricsIntoChart(chartPath: string, lyrics: LrcLyrics): Promise<void> {
    let content = await fs.promises.readFile(chartPath, 'utf-8')

    // Get resolution and BPM from chart
    const resMatch = content.match(/Resolution\s*=\s*(\d+)/i)
    const resolution = resMatch ? parseInt(resMatch[1], 10) : 192

    // Get BPM from [SyncTrack] section
    const syncMatch = content.match(/\[SyncTrack\][\s\S]*?(\d+)\s*=\s*B\s+(\d+)/i)
    const bpm = syncMatch ? parseInt(syncMatch[2], 10) / 1000 : 120

    // Generate lyric events
    const lyricEvents = this.lyricsToChartEvents(lyrics, resolution, bpm)

    // Check if [Events] section exists
    const eventsMatch = content.match(/\[Events\]\s*\{([^}]*)\}/i)

    if (eventsMatch) {
      // Insert lyrics into existing Events section
      const existingEvents = eventsMatch[1]
      
      // Remove any existing lyric events
      const cleanedEvents = existingEvents
        .split('\n')
        .filter(line => !line.includes('"lyric ') && !line.includes('"phrase_'))
        .join('\n')

      const newEventsContent = cleanedEvents.trim() + '\n' + lyricEvents.join('\n') + '\n'
      content = content.replace(/\[Events\]\s*\{[^}]*\}/i, `[Events]\n{\n${newEventsContent}}`)
    } else {
      // Add new Events section before first track section
      const eventsSection = `[Events]\n{\n${lyricEvents.join('\n')}\n}\n`
      
      // Find a good place to insert (after [Song] and [SyncTrack])
      const insertMatch = content.match(/(\[SyncTrack\]\s*\{[^}]*\})/i)
      if (insertMatch) {
        const insertPos = content.indexOf(insertMatch[0]) + insertMatch[0].length
        content = content.slice(0, insertPos) + '\n' + eventsSection + content.slice(insertPos)
      } else {
        // Just append
        content += '\n' + eventsSection
      }
    }

    await fs.promises.writeFile(chartPath, content, 'utf-8')
  }

  /**
   * Download and inject lyrics into a chart
   */
  async downloadAndInjectLyrics(
    chartId: number,
    lyricsId: number,
    chartPath: string,
    chartType: 'mid' | 'chart' | 'sng' | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Emit progress
      this.emit('lyricsProgress', {
        phase: 'downloading',
        percent: 20,
        message: 'Downloading lyrics from LRCLIB...',
        chartId,
      })

      // Get lyrics
      const lyricsResult = await this.getLyricsById(lyricsId)
      if (!lyricsResult || !lyricsResult.syncedLyrics) {
        return { success: false, error: 'No synced lyrics found' }
      }

      this.emit('lyricsProgress', {
        phase: 'converting',
        percent: 50,
        message: 'Converting lyrics...',
        chartId,
      })

      // Parse LRC
      const lyrics = this.parseLrc(lyricsResult.syncedLyrics)
      if (lyrics.lines.length === 0) {
        return { success: false, error: 'Lyrics are empty' }
      }

      this.emit('lyricsProgress', {
        phase: 'writing',
        percent: 80,
        message: 'Writing lyrics to chart...',
        chartId,
      })

      // Find the chart file
      const chartDir = chartPath
      let chartFile: string | null = null
      let midiFile: string | null = null

      const entries = await fs.promises.readdir(chartDir)
      for (const entry of entries) {
        const lower = entry.toLowerCase()
        if (lower === 'notes.chart') {
          chartFile = path.join(chartDir, entry)
        } else if (lower === 'notes.mid') {
          midiFile = path.join(chartDir, entry)
        }
      }

      if (!chartFile) {
        // Try to find any .chart file
        for (const entry of entries) {
          if (entry.toLowerCase().endsWith('.chart')) {
            chartFile = path.join(chartDir, entry)
            break
          }
        }
      }

      if (!midiFile) {
        // Try to find any .mid file
        for (const entry of entries) {
          if (entry.toLowerCase().endsWith('.mid')) {
            midiFile = path.join(chartDir, entry)
            break
          }
        }
      }

      // Prefer .chart files, but support .mid
      if (chartFile) {
        await this.injectLyricsIntoChart(chartFile, lyrics)
      } else if (midiFile) {
        await this.injectLyricsIntoMidi(midiFile, lyrics)
      } else {
        return { success: false, error: 'No .chart or .mid file found in folder' }
      }

      this.emit('lyricsProgress', {
        phase: 'complete',
        percent: 100,
        message: 'Lyrics added successfully!',
        chartId,
      })

      return { success: true }
    } catch (err) {
      this.emit('lyricsProgress', {
        phase: 'error',
        percent: 0,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        chartId,
      })

      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * HTTP GET helper
   */
  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Bridge-Catalog-Manager/1.0',
        },
      }, (res) => {
        if (res.statusCode === 404) {
          reject(new Error('Not found'))
          return
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }

        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => resolve(data))
        res.on('error', reject)
      }).on('error', reject)
    })
  }

  /**
   * Inject lyrics into a MIDI file
   * Creates/updates the PART VOCALS track with lyric meta events
   */
  private async injectLyricsIntoMidi(midiPath: string, lyrics: LrcLyrics): Promise<void> {
    const buffer = await fs.promises.readFile(midiPath)
    
    // Parse MIDI header
    if (buffer.toString('ascii', 0, 4) !== 'MThd') {
      throw new Error('Invalid MIDI file')
    }
    
    const headerLength = buffer.readUInt32BE(4)
    const format = buffer.readUInt16BE(8)
    const numTracks = buffer.readUInt16BE(10)
    const division = buffer.readUInt16BE(12)
    
    // Calculate ticks per millisecond (assuming 120 BPM default, will be adjusted by tempo events)
    // division is ticks per quarter note
    // at 120 BPM, quarter note = 500ms
    // default ticksPerMs = division / 500
    const defaultTicksPerMs = division / 500

    // Find existing PART VOCALS track or create one
    let pos = 8 + headerLength
    let vocalsTrackStart = -1
    let vocalsTrackEnd = -1
    let trackIndex = 0
    
    while (pos < buffer.length && trackIndex < numTracks) {
      if (buffer.toString('ascii', pos, pos + 4) !== 'MTrk') {
        break
      }
      
      const trackLength = buffer.readUInt32BE(pos + 4)
      const trackDataStart = pos + 8
      const trackDataEnd = trackDataStart + trackLength
      
      // Check if this is PART VOCALS track
      const trackData = buffer.slice(trackDataStart, Math.min(trackDataEnd, trackDataStart + 200))
      if (trackData.includes(Buffer.from('PART VOCALS'))) {
        vocalsTrackStart = pos
        vocalsTrackEnd = trackDataEnd
      }
      
      pos = trackDataEnd
      trackIndex++
    }

    // Build new PART VOCALS track with lyrics
    const newTrack = this.buildMidiLyricsTrack(lyrics, division, defaultTicksPerMs)
    
    let newBuffer: Buffer
    
    if (vocalsTrackStart >= 0) {
      // Replace existing PART VOCALS track
      const before = buffer.slice(0, vocalsTrackStart)
      const after = buffer.slice(vocalsTrackEnd)
      newBuffer = Buffer.concat([before, newTrack, after])
    } else {
      // Append new track and update track count
      newBuffer = Buffer.concat([buffer, newTrack])
      // Update number of tracks in header
      newBuffer.writeUInt16BE(numTracks + 1, 10)
    }
    
    await fs.promises.writeFile(midiPath, newBuffer)
  }

  /**
   * Build a MIDI track with lyrics
   */
  private buildMidiLyricsTrack(lyrics: LrcLyrics, division: number, ticksPerMs: number): Buffer {
    const chunks: Buffer[] = []
    
    // Track header
    chunks.push(Buffer.from('MTrk'))
    
    // We'll calculate length at the end
    const lengthPlaceholder = Buffer.alloc(4)
    chunks.push(lengthPlaceholder)
    
    // Track name event: FF 03 len "PART VOCALS"
    const trackName = Buffer.from('PART VOCALS')
    chunks.push(Buffer.from([0x00, 0xFF, 0x03, trackName.length]))
    chunks.push(trackName)
    
    // Add lyric events
    let lastTick = 0
    
    for (const line of lyrics.lines) {
      const tick = Math.round(line.time * ticksPerMs)
      const delta = Math.max(0, tick - lastTick)
      lastTick = tick
      
      // Variable-length delta time
      chunks.push(this.encodeVariableLength(delta))
      
      // Lyric meta event: FF 05 len text
      const textBuffer = Buffer.from(line.text, 'utf-8')
      chunks.push(Buffer.from([0xFF, 0x05]))
      chunks.push(this.encodeVariableLength(textBuffer.length))
      chunks.push(textBuffer)
    }
    
    // End of track: FF 2F 00
    chunks.push(Buffer.from([0x00, 0xFF, 0x2F, 0x00]))
    
    // Calculate total track data length (excluding header)
    const trackData = Buffer.concat(chunks.slice(2))
    lengthPlaceholder.writeUInt32BE(trackData.length, 0)
    
    return Buffer.concat(chunks)
  }

  /**
   * Encode a number as MIDI variable-length quantity
   */
  private encodeVariableLength(value: number): Buffer {
    if (value < 0) value = 0
    
    const bytes: number[] = []
    bytes.push(value & 0x7F)
    value >>= 7
    
    while (value > 0) {
      bytes.push((value & 0x7F) | 0x80)
      value >>= 7
    }
    
    return Buffer.from(bytes.reverse())
  }
}

// Singleton
let instance: LyricsService | null = null

export function getLyricsService(): LyricsService {
  if (!instance) {
    instance = new LyricsService()
  }
  return instance
}
