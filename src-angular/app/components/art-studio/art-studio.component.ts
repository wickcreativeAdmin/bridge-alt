/**
 * Bridge Art Studio Module - Component
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ArtStudioService } from '../../core/services/art-studio.service'
import { CatalogService } from '../../core/services/catalog.service'
import { 
  AlbumArtResult, 
  ArtDownloadProgress,
  ChartArtMatch 
} from '../../../../src-shared/interfaces/art-studio.interface.js'

type ViewMode = 'overview' | 'albumArt' | 'backgrounds'

@Component({
  selector: 'app-art-studio',
  templateUrl: './art-studio.component.html',
  standalone: false,
})
export class ArtStudioComponent implements OnInit {
  // View state
  viewMode: ViewMode = 'overview'
  
  // Charts lists
  chartsMissingAlbumArt: ChartArtMatch[] = []
  chartsMissingBackground: ChartArtMatch[] = []
  filteredAlbumArtCharts: ChartArtMatch[] = []
  filteredBackgroundCharts: ChartArtMatch[] = []
  loadingCharts = false

  // Filter/sort state
  filterQuery = ''
  filterArtist = ''
  sortField: 'artist' | 'name' = 'artist'
  sortDirection: 'asc' | 'desc' = 'asc'
  albumArtArtistOptions: string[] = []
  backgroundArtistOptions: string[] = []

  // Selected chart for single operations
  selectedChart: ChartArtMatch | null = null

  // Album art search
  albumArtResults: AlbumArtResult[] = []
  isSearchingArt = false
  searchError: string | null = null

  // Progress
  downloadProgress: ArtDownloadProgress | null = null
  isProcessing = false

  // Batch operations
  batchMode = false
  selectedChartIds = new Set<number>()
  batchResults: { success: number; failed: number; skipped: number } | null = null

  // Blur setting for background generation
  blurAmount = 50  // Default blur sigma (0-100)

  constructor(
    private artStudioService: ArtStudioService,
    private catalogService: CatalogService,
    private ref: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.artStudioService.downloadProgress$.subscribe(progress => {
      this.downloadProgress = progress
      this.ref.detectChanges()

      if (progress?.phase === 'complete') {
        this.loadCharts()
        this.catalogService.refreshStats()
      }
    })

    this.artStudioService.isProcessing$.subscribe(processing => {
      this.isProcessing = processing
      this.ref.detectChanges()
    })

    this.loadCharts()
  }

  async loadCharts(): Promise<void> {
    this.loadingCharts = true
    this.ref.detectChanges()

    try {
      const [albumArt, backgrounds] = await Promise.all([
        this.artStudioService.getChartsMissingAlbumArt(10000),
        this.artStudioService.getChartsMissingBackground(10000),
      ])
      this.chartsMissingAlbumArt = albumArt
      this.chartsMissingBackground = backgrounds
      this.buildArtistOptions()
      this.applyAlbumArtFilter()
      this.applyBackgroundFilter()
    } catch (err) {
      console.error('Failed to load charts:', err)
    } finally {
      this.loadingCharts = false
      this.ref.detectChanges()
    }
  }

  buildArtistOptions(): void {
    const albumArtArtists = new Set<string>()
    this.chartsMissingAlbumArt.forEach(c => {
      if (c.chartArtist) albumArtArtists.add(c.chartArtist)
    })
    this.albumArtArtistOptions = Array.from(albumArtArtists).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    )

    const bgArtists = new Set<string>()
    this.chartsMissingBackground.forEach(c => {
      if (c.chartArtist) bgArtists.add(c.chartArtist)
    })
    this.backgroundArtistOptions = Array.from(bgArtists).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }

  applyAlbumArtFilter(): void {
    let result = [...this.chartsMissingAlbumArt]

    if (this.filterQuery) {
      const query = this.filterQuery.toLowerCase()
      result = result.filter(c => 
        c.chartName.toLowerCase().includes(query) ||
        c.chartArtist.toLowerCase().includes(query)
      )
    }

    if (this.filterArtist) {
      result = result.filter(c => c.chartArtist === this.filterArtist)
    }

    result.sort((a, b) => {
      const aVal = this.sortField === 'artist' ? a.chartArtist : a.chartName
      const bVal = this.sortField === 'artist' ? b.chartArtist : b.chartName
      const cmp = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
      return this.sortDirection === 'asc' ? cmp : -cmp
    })

    this.filteredAlbumArtCharts = result
    this.ref.detectChanges()
  }

  applyBackgroundFilter(): void {
    let result = [...this.chartsMissingBackground]

    if (this.filterQuery) {
      const query = this.filterQuery.toLowerCase()
      result = result.filter(c => 
        c.chartName.toLowerCase().includes(query) ||
        c.chartArtist.toLowerCase().includes(query)
      )
    }

    if (this.filterArtist) {
      result = result.filter(c => c.chartArtist === this.filterArtist)
    }

    result.sort((a, b) => {
      const aVal = this.sortField === 'artist' ? a.chartArtist : a.chartName
      const bVal = this.sortField === 'artist' ? b.chartArtist : b.chartName
      const cmp = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
      return this.sortDirection === 'asc' ? cmp : -cmp
    })

    this.filteredBackgroundCharts = result
    this.ref.detectChanges()
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    this.applyAlbumArtFilter()
    this.applyBackgroundFilter()
  }

  clearFilters(): void {
    this.filterQuery = ''
    this.filterArtist = ''
    this.applyAlbumArtFilter()
    this.applyBackgroundFilter()
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode
    this.selectedChart = null
    this.albumArtResults = []
    this.searchError = null
    this.batchMode = false
    this.selectedChartIds.clear()
    this.batchResults = null
    this.filterQuery = ''
    this.filterArtist = ''
    this.applyAlbumArtFilter()
    this.applyBackgroundFilter()
    this.ref.detectChanges()
  }

  selectChart(chart: ChartArtMatch): void {
    this.selectedChart = chart
    this.albumArtResults = []
    this.searchError = null
    this.ref.detectChanges()

    // Auto-search for album art
    if (this.viewMode === 'albumArt') {
      this.searchAlbumArt()
    }
  }

  async searchAlbumArt(): Promise<void> {
    if (!this.selectedChart) return

    this.isSearchingArt = true
    this.searchError = null
    this.albumArtResults = []
    this.ref.detectChanges()

    try {
      this.albumArtResults = await this.artStudioService.searchAlbumArt(
        this.selectedChart.chartArtist,
        this.selectedChart.chartAlbum || this.selectedChart.chartName
      )
      
      if (this.albumArtResults.length === 0) {
        this.searchError = 'No album art found. Try searching manually.'
      }
    } catch (err) {
      this.searchError = `Search failed: ${err}`
    } finally {
      this.isSearchingArt = false
      this.ref.detectChanges()
    }
  }

  async downloadAlbumArt(result: AlbumArtResult): Promise<void> {
    if (!this.selectedChart) return

    try {
      await this.artStudioService.downloadImage({
        chartId: this.selectedChart.chartId,
        imageUrl: result.url,
        outputPath: this.selectedChart.chartPath,
        type: 'album',
      })
      
      // Remove from list and clear selection
      this.chartsMissingAlbumArt = this.chartsMissingAlbumArt.filter(
        c => c.chartId !== this.selectedChart?.chartId
      )
      this.applyAlbumArtFilter()
      this.selectedChart = null
      this.albumArtResults = []
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  async generateBackground(): Promise<void> {
    if (!this.selectedChart) return

    try {
      await this.artStudioService.generateBackground({
        chartId: this.selectedChart.chartId,
        outputPath: this.selectedChart.chartPath,
        style: this.selectedChart.hasAlbumArt ? 'blur' : 'gradient',
      })

      // Remove from list and clear selection
      this.chartsMissingBackground = this.chartsMissingBackground.filter(
        c => c.chartId !== this.selectedChart?.chartId
      )
      this.applyBackgroundFilter()
      this.selectedChart = null
    } catch (err) {
      console.error('Generate failed:', err)
    }
  }

  // Batch operations
  toggleBatchMode(): void {
    this.batchMode = !this.batchMode
    this.selectedChartIds.clear()
    this.batchResults = null
    this.ref.detectChanges()
  }

  toggleChartSelection(chartId: number): void {
    if (this.selectedChartIds.has(chartId)) {
      this.selectedChartIds.delete(chartId)
    } else {
      this.selectedChartIds.add(chartId)
    }
    this.ref.detectChanges()
  }

  selectAll(charts: ChartArtMatch[]): void {
    if (this.selectedChartIds.size === charts.length) {
      this.selectedChartIds.clear()
    } else {
      charts.forEach(c => this.selectedChartIds.add(c.chartId))
    }
    this.ref.detectChanges()
  }

  async batchFetchAlbumArt(): Promise<void> {
    if (this.selectedChartIds.size === 0) return

    this.batchResults = null
    this.ref.detectChanges()

    try {
      this.batchResults = await this.artStudioService.batchFetchAlbumArt(
        Array.from(this.selectedChartIds)
      )
      await this.loadCharts()
      this.selectedChartIds.clear()
    } catch (err) {
      console.error('Batch fetch failed:', err)
    }
  }

  async batchGenerateBackgrounds(): Promise<void> {
    if (this.selectedChartIds.size === 0) return

    this.batchResults = null
    this.ref.detectChanges()

    try {
      this.batchResults = await this.artStudioService.batchGenerateBackgrounds(
        Array.from(this.selectedChartIds)
      )
      await this.loadCharts()
      this.selectedChartIds.clear()
    } catch (err) {
      console.error('Batch generate failed:', err)
    }
  }

  async batchDeleteBackgrounds(): Promise<void> {
    if (this.selectedChartIds.size === 0) return

    const confirmed = confirm(`Delete backgrounds from ${this.selectedChartIds.size} charts?`)
    if (!confirmed) return

    this.batchResults = null
    this.isProcessing = true
    this.ref.detectChanges()

    try {
      const result = await window.electron.invoke.artBatchDeleteBackgrounds(
        Array.from(this.selectedChartIds)
      )
      this.batchResults = { success: result.success, failed: result.failed, skipped: 0 }
      await this.loadCharts()
      this.selectedChartIds.clear()
    } catch (err) {
      console.error('Batch delete failed:', err)
    } finally {
      this.isProcessing = false
      this.ref.detectChanges()
    }
  }

  async batchRegenerateBackgrounds(): Promise<void> {
    if (this.selectedChartIds.size === 0) return

    const confirmed = confirm(
      `Regenerate backgrounds for ${this.selectedChartIds.size} charts with blur amount ${this.blurAmount}?\n\n` +
      `This will delete existing backgrounds and create new ones.`
    )
    if (!confirmed) return

    this.batchResults = null
    this.isProcessing = true
    this.ref.detectChanges()

    try {
      const result = await window.electron.invoke.artBatchRegenerateBackgrounds({
        chartIds: Array.from(this.selectedChartIds),
        blurAmount: this.blurAmount
      })
      this.batchResults = result
      await this.loadCharts()
      this.selectedChartIds.clear()
    } catch (err) {
      console.error('Batch regenerate failed:', err)
    } finally {
      this.isProcessing = false
      this.ref.detectChanges()
    }
  }

  goBack(): void {
    this.selectedChart = null
    this.albumArtResults = []
    this.searchError = null
    this.ref.detectChanges()
  }
}
