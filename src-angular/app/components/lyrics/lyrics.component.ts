/**
 * Bridge Lyrics Module - Angular Component
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ChartLyricsMatch, LyricsSearchResult, LyricsDownloadProgress } from '../../../../src-shared/interfaces/lyrics.interface.js'
import { LyricsService } from '../../core/services/lyrics.service'

@Component({
  selector: 'app-lyrics',
  templateUrl: './lyrics.component.html',
  standalone: false,
})
export class LyricsComponent implements OnInit {
  // Data
  chartsMissingLyrics: ChartLyricsMatch[] = []
  filteredCharts: ChartLyricsMatch[] = []
  searchResults: LyricsSearchResult[] = []
  
  // UI State
  isLoading = false
  isSearching = false
  isDownloading = false
  selectedChart: ChartLyricsMatch | null = null
  selectedLyrics: LyricsSearchResult | null = null
  progress: LyricsDownloadProgress | null = null
  error: string | null = null
  successMessage: string | null = null

  // Search state
  searchArtist = ''
  searchTitle = ''

  // Filter state
  filterQuery = ''
  filterArtist = ''
  sortField: 'artist' | 'name' = 'artist'
  sortDirection: 'asc' | 'desc' = 'asc'
  artistOptions: string[] = []

  constructor(
    private lyricsService: LyricsService,
    private ref: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.lyricsService.progress$.subscribe(progress => {
      this.progress = progress
      this.ref.detectChanges()
    })

    this.loadChartsMissingLyrics()
  }

  async loadChartsMissingLyrics(): Promise<void> {
    this.isLoading = true
    this.error = null
    this.ref.detectChanges()

    try {
      this.chartsMissingLyrics = await this.lyricsService.getChartsMissingLyrics()
      this.buildArtistOptions()
      this.applyFilter()
    } catch (err) {
      this.error = `Failed to load charts: ${err}`
    } finally {
      this.isLoading = false
      this.ref.detectChanges()
    }
  }

  buildArtistOptions(): void {
    const artists = new Set<string>()
    for (const chart of this.chartsMissingLyrics) {
      if (chart.chartArtist) {
        artists.add(chart.chartArtist)
      }
    }
    this.artistOptions = Array.from(artists).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }

  applyFilter(): void {
    let filtered = [...this.chartsMissingLyrics]

    // Text search
    if (this.filterQuery) {
      const query = this.filterQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.chartName.toLowerCase().includes(query) ||
        c.chartArtist.toLowerCase().includes(query)
      )
    }

    // Artist filter
    if (this.filterArtist) {
      filtered = filtered.filter(c => c.chartArtist === this.filterArtist)
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = this.sortField === 'artist' ? a.chartArtist : a.chartName
      const bVal = this.sortField === 'artist' ? b.chartArtist : b.chartName
      const cmp = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
      return this.sortDirection === 'asc' ? cmp : -cmp
    })

    this.filteredCharts = filtered
    this.ref.detectChanges()
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    this.applyFilter()
  }

  clearFilters(): void {
    this.filterQuery = ''
    this.filterArtist = ''
    this.sortField = 'artist'
    this.sortDirection = 'asc'
    this.applyFilter()
  }

  selectChart(chart: ChartLyricsMatch): void {
    this.selectedChart = chart
    this.searchResults = []
    this.selectedLyrics = null
    this.error = null
    this.successMessage = null
    
    // Pre-fill search fields
    this.searchArtist = chart.chartArtist
    this.searchTitle = chart.chartName
    
    this.ref.detectChanges()
  }

  clearSelection(): void {
    this.selectedChart = null
    this.searchResults = []
    this.selectedLyrics = null
    this.searchArtist = ''
    this.searchTitle = ''
    this.error = null
    this.successMessage = null
    this.ref.detectChanges()
  }

  async searchLyrics(): Promise<void> {
    if (!this.searchArtist.trim() && !this.searchTitle.trim()) {
      this.error = 'Please enter artist or title to search'
      return
    }

    this.isSearching = true
    this.error = null
    this.searchResults = []
    this.selectedLyrics = null
    this.ref.detectChanges()

    try {
      this.searchResults = await this.lyricsService.searchLyrics(
        this.searchArtist.trim(),
        this.searchTitle.trim()
      )

      if (this.searchResults.length === 0) {
        this.error = 'No synced lyrics found. Try different search terms.'
      }
    } catch (err) {
      this.error = `Search failed: ${err}`
    } finally {
      this.isSearching = false
      this.ref.detectChanges()
    }
  }

  selectLyrics(lyrics: LyricsSearchResult): void {
    this.selectedLyrics = lyrics
    this.ref.detectChanges()
  }

  previewLyrics(lyrics: LyricsSearchResult): void {
    // Open LRCLIB page
    window.electron.emit.openUrl(`https://lrclib.net/`)
  }

  async downloadLyrics(): Promise<void> {
    if (!this.selectedChart || !this.selectedLyrics) return

    this.isDownloading = true
    this.error = null
    this.successMessage = null
    this.ref.detectChanges()

    try {
      const result = await this.lyricsService.downloadLyrics(
        this.selectedChart.chartId,
        this.selectedLyrics.id,
        this.selectedChart.chartPath,
        'chart' // We only support .chart files for now
      )

      if (result.success) {
        this.successMessage = 'Lyrics added successfully!'
        
        // Remove from list
        this.chartsMissingLyrics = this.chartsMissingLyrics.filter(
          c => c.chartId !== this.selectedChart!.chartId
        )
        this.applyFilter()
        
        // Clear selection after a moment
        setTimeout(() => {
          this.clearSelection()
        }, 1500)
      } else {
        this.error = result.error || 'Failed to add lyrics'
      }
    } catch (err) {
      this.error = `Download failed: ${err}`
    } finally {
      this.isDownloading = false
      this.ref.detectChanges()
    }
  }

  formatDuration(ms: number | null): string {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  formatLyricsDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Preview synced lyrics
  getLyricsPreview(syncedLyrics: string | null): string {
    if (!syncedLyrics) return 'No synced lyrics'
    const lines = syncedLyrics.split('\n').slice(0, 5)
    return lines.map(l => l.replace(/\[\d{2}:\d{2}[.:]\d{2,3}\]/g, '').trim()).filter(l => l).join(' / ')
  }

  dismissError(): void {
    this.error = null
    this.ref.detectChanges()
  }

  dismissSuccess(): void {
    this.successMessage = null
    this.ref.detectChanges()
  }
}
