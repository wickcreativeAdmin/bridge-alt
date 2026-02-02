/**
 * Bridge Catalog Manager - Library Component
 * Main UI for browsing and managing local chart library
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs'
import { ChartRecord, CatalogStats, ScanProgress, CatalogFilter } from '../../../../src-shared/interfaces/catalog.interface.js'
import { CatalogService } from '../../core/services/catalog.service'

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  standalone: false,
})
export class LibraryComponent implements OnInit {
  private searchSubject = new Subject<string>()

  // Data
  charts: ChartRecord[] = []
  stats: CatalogStats | null = null
  scanProgress: ScanProgress | null = null
  libraryPaths: string[] = []

  // UI State
  isLoading = false
  selectedIds = new Set<number>()
  searchQuery = ''
  editingChart: ChartRecord | null = null
  showFolderModal = false
  showFiltersExpanded = false
  removalFolder: string | null = null
  showRemovalConfirm = false
  chartToRemove: ChartRecord | null = null
  removalError: string | null = null

  // Filter state
  filter: CatalogFilter = {
    sortBy: 'artist',
    sortDirection: 'asc',
  }

  // Filter dropdown options
  artistOptions: string[] = []
  charterOptions: string[] = []
  genreOptions: string[] = []
  albumOptions: string[] = []

  constructor(
    private catalogService: CatalogService,
    private ref: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Subscribe to service observables
    this.catalogService.charts$.subscribe(charts => {
      this.charts = charts
      this.ref.detectChanges()
    })

    this.catalogService.stats$.subscribe(stats => {
      this.stats = stats
      this.ref.detectChanges()
    })

    this.catalogService.scanProgress$.subscribe(progress => {
      this.scanProgress = progress
      this.ref.detectChanges()
    })

    this.catalogService.isLoading$.subscribe(loading => {
      this.isLoading = loading
      this.ref.detectChanges()
    })

    this.catalogService.libraryPaths$.subscribe(paths => {
      this.libraryPaths = paths
      this.ref.detectChanges()
    })

    this.catalogService.filter$.subscribe(filter => {
      this.filter = filter
      this.ref.detectChanges()
    })

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(query => {
      this.catalogService.search(query)
    })

    // Load filter options
    this.loadFilterOptions()
    this.loadRemovalFolder()
  }

  async loadRemovalFolder(): Promise<void> {
    this.removalFolder = await this.catalogService.getRemovalFolder()
    this.ref.detectChanges()
  }

  async loadFilterOptions(): Promise<void> {
    this.artistOptions = await this.catalogService.getDistinctValues('artist')
    this.charterOptions = await this.catalogService.getDistinctValues('charter')
    this.genreOptions = await this.catalogService.getDistinctValues('genre')
    this.albumOptions = await this.catalogService.getDistinctValues('album')
    this.ref.detectChanges()
  }

  toggleFilters(): void {
    this.showFiltersExpanded = !this.showFiltersExpanded
    this.ref.detectChanges()
  }

  // Folder management
  manageFolders(): void {
    this.showFolderModal = true
    this.ref.detectChanges()
  }

  closeFolderModal(): void {
    this.showFolderModal = false
    this.ref.detectChanges()
  }

  async addFolder(): Promise<void> {
    const newPath = await this.catalogService.addLibraryPath()
    if (newPath) {
      this.ref.detectChanges()
    }
  }

  async removeFolder(index: number): Promise<void> {
    await this.catalogService.removeLibraryPath(index)
    this.ref.detectChanges()
  }

  async saveFoldersAndScan(): Promise<void> {
    this.closeFolderModal()
    await this.scanLibrary()
  }

  async scanLibrary(): Promise<void> {
    if (this.libraryPaths.length === 0) {
      this.manageFolders()
      return
    }
    await this.catalogService.scanLibrary()
    await this.loadFilterOptions()
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value
    this.searchQuery = query
    this.searchSubject.next(query)
  }

  clearSearch(): void {
    this.searchQuery = ''
    this.searchSubject.next('')
  }

  sortBy(column: string): void {
    if (this.filter.sortBy === column) {
      this.catalogService.setFilter({
        sortDirection: this.filter.sortDirection === 'asc' ? 'desc' : 'asc'
      })
    } else {
      this.catalogService.setFilter({
        sortBy: column as CatalogFilter['sortBy'],
        sortDirection: 'asc'
      })
    }
  }

  getSortIndicator(column: string): string {
    if (this.filter.sortBy !== column) return ''
    return this.filter.sortDirection === 'asc' ? ' ▲' : ' ▼'
  }

  filterByAsset(asset: 'video' | 'background' | 'albumArt', hasAsset: boolean | undefined): void {
    switch (asset) {
      case 'video':
        this.catalogService.setFilter({ hasVideo: hasAsset })
        break
      case 'background':
        this.catalogService.setFilter({ hasBackground: hasAsset })
        break
      case 'albumArt':
        this.catalogService.setFilter({ hasAlbumArt: hasAsset })
        break
    }
  }

  filterByArtist(artist: string): void {
    this.catalogService.setFilter({ artist: artist || undefined })
  }

  filterByCharter(charter: string): void {
    this.catalogService.setFilter({ charter: charter || undefined })
  }

  filterByGenre(genre: string): void {
    this.catalogService.setFilter({ genre: genre || undefined })
  }

  filterByChartType(chartType: string): void {
    this.catalogService.setFilter({ chartType: (chartType || undefined) as 'mid' | 'chart' | undefined })
  }

  filterByInstrument(instrument: string, value: string): void {
    const hasValue = value === '' ? undefined : value === 'true'
    switch (instrument) {
      case 'guitar':
        this.catalogService.setFilter({ hasGuitar: hasValue })
        break
      case 'bass':
        this.catalogService.setFilter({ hasBass: hasValue })
        break
      case 'drums':
        this.catalogService.setFilter({ hasDrums: hasValue })
        break
      case 'keys':
        this.catalogService.setFilter({ hasKeys: hasValue })
        break
      case 'vocals':
        this.catalogService.setFilter({ hasVocals: hasValue })
        break
    }
  }

  filterByDifficulty(instrument: string, diff: string): void {
    const diffValue = (diff || undefined) as 'e' | 'm' | 'h' | 'x' | undefined
    switch (instrument) {
      case 'guitar':
        this.catalogService.setFilter({ guitarDiff: diffValue })
        break
      case 'bass':
        this.catalogService.setFilter({ bassDiff: diffValue })
        break
      case 'drums':
        this.catalogService.setFilter({ drumsDiff: diffValue })
        break
      case 'keys':
        this.catalogService.setFilter({ keysDiff: diffValue })
        break
    }
  }

  clearFilters(): void {
    this.searchQuery = ''
    this.catalogService.clearFilters()
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filter.search ||
      this.filter.artist ||
      this.filter.charter ||
      this.filter.genre ||
      this.filter.chartType ||
      this.filter.hasVideo !== undefined ||
      this.filter.hasBackground !== undefined ||
      this.filter.hasAlbumArt !== undefined ||
      this.filter.hasGuitar !== undefined ||
      this.filter.hasBass !== undefined ||
      this.filter.hasDrums !== undefined ||
      this.filter.hasKeys !== undefined ||
      this.filter.hasVocals !== undefined ||
      this.filter.guitarDiff ||
      this.filter.bassDiff ||
      this.filter.drumsDiff ||
      this.filter.keysDiff
    )
  }

  toggleSelection(chart: ChartRecord): void {
    if (this.selectedIds.has(chart.id)) {
      this.selectedIds.delete(chart.id)
    } else {
      this.selectedIds.add(chart.id)
    }
    this.ref.detectChanges()
  }

  isSelected(chart: ChartRecord): boolean {
    return this.selectedIds.has(chart.id)
  }

  selectAll(): void {
    if (this.selectedIds.size === this.charts.length) {
      this.selectedIds.clear()
    } else {
      this.charts.forEach(c => this.selectedIds.add(c.id))
    }
    this.ref.detectChanges()
  }

  get allSelected(): boolean {
    return this.charts.length > 0 && this.selectedIds.size === this.charts.length
  }

  get selectedCharts(): ChartRecord[] {
    return this.catalogService.getChartsByIds([...this.selectedIds])
  }

  clearSelection(): void {
    this.selectedIds.clear()
    this.ref.detectChanges()
  }

  openFolder(chart: ChartRecord): void {
    this.catalogService.openChartFolder(chart.id)
  }

  editChart(chart: ChartRecord): void {
    this.editingChart = { ...chart }
    this.ref.detectChanges()
  }

  async saveChart(): Promise<void> {
    if (!this.editingChart) return

    await this.catalogService.updateChart(this.editingChart.id, {
      name: this.editingChart.name,
      artist: this.editingChart.artist,
      album: this.editingChart.album,
      genre: this.editingChart.genre,
      year: this.editingChart.year,
      charter: this.editingChart.charter,
    })

    this.editingChart = null
    await this.loadFilterOptions()
  }

  cancelEdit(): void {
    this.editingChart = null
    this.ref.detectChanges()
  }

  // Removal folder management
  async setRemovalFolder(): Promise<void> {
    const folder = await this.catalogService.setRemovalFolder()
    if (folder) {
      this.removalFolder = folder
      this.ref.detectChanges()
    }
  }

  async clearRemovalFolder(): Promise<void> {
    await this.catalogService.clearRemovalFolder()
    this.removalFolder = null
    this.ref.detectChanges()
  }

  confirmRemoveChart(chart: ChartRecord): void {
    if (!this.removalFolder) {
      this.removalError = 'Please set a removal folder first. Click the Folders button to configure it.'
      this.ref.detectChanges()
      return
    }
    this.chartToRemove = chart
    this.showRemovalConfirm = true
    this.removalError = null
    this.ref.detectChanges()
  }

  cancelRemoval(): void {
    this.chartToRemove = null
    this.showRemovalConfirm = false
    this.removalError = null
    this.ref.detectChanges()
  }

  async executeRemoval(): Promise<void> {
    if (!this.chartToRemove) return

    this.removalError = null
    const chartName = `${this.chartToRemove.artist} - ${this.chartToRemove.name}`
    
    try {
      const result = await this.catalogService.removeChart(this.chartToRemove.id)
      
      if (!result.success) {
        this.removalError = result.error || 'Unknown error occurred'
        console.error('Removal failed:', result.error)
        // Keep modal open to show error
        this.ref.detectChanges()
        return
      }

      // Success - close modal
      this.chartToRemove = null
      this.showRemovalConfirm = false
      this.selectedIds.clear()
      this.ref.detectChanges()
    } catch (err) {
      this.removalError = `Exception: ${err instanceof Error ? err.message : String(err)}`
      console.error('Removal exception:', err)
      this.ref.detectChanges()
    }
  }

  async removeSelectedCharts(): Promise<void> {
    if (!this.removalFolder) {
      this.removalError = 'Please set a removal folder first. Click the Folders button to configure it.'
      this.ref.detectChanges()
      return
    }

    if (this.selectedIds.size === 0) return

    const confirmed = confirm(`Remove ${this.selectedIds.size} chart(s) to the removal folder?`)
    if (!confirmed) return

    this.removalError = null
    
    try {
      const result = await this.catalogService.removeCharts([...this.selectedIds])
      
      if (result.failed > 0) {
        this.removalError = `Removed ${result.success} charts. ${result.failed} failed.\n${result.errors.join('\n')}`
        console.error('Batch removal errors:', result.errors)
      }

      this.selectedIds.clear()
      this.ref.detectChanges()
    } catch (err) {
      this.removalError = `Exception: ${err instanceof Error ? err.message : String(err)}`
      console.error('Batch removal exception:', err)
      this.ref.detectChanges()
    }
  }

  dismissError(): void {
    this.removalError = null
    this.ref.detectChanges()
  }

  // Format difficulty levels for display
  formatDiffs(diffs: string): string {
    if (!diffs) return '-'
    return diffs.split(',').map(d => {
      switch (d) {
        case 'e': return 'E'
        case 'm': return 'M'
        case 'h': return 'H'
        case 'x': return 'X'
        default: return d.toUpperCase()
      }
    }).join('')
  }

  // Stats helpers
  get missingVideoCount(): number {
    return this.stats ? this.stats.totalCharts - this.stats.withVideo : 0
  }

  get missingBackgroundCount(): number {
    return this.stats ? this.stats.totalCharts - this.stats.withBackground : 0
  }

  get missingAlbumArtCount(): number {
    return this.stats ? this.stats.totalCharts - this.stats.withAlbumArt : 0
  }

  get scanProgressPercent(): number {
    if (!this.scanProgress || this.scanProgress.total === 0) return 0
    return Math.round((this.scanProgress.current / this.scanProgress.total) * 100)
  }

  get isScanning(): boolean {
    return this.scanProgress !== null &&
           this.scanProgress.phase !== 'complete' &&
           this.scanProgress.phase !== 'error'
  }

  // Asset deletion methods
  async deleteVideo(chart: ChartRecord): Promise<void> {
    if (!confirm(`Delete video from "${chart.artist} - ${chart.name}"?`)) return
    
    try {
      const result = await window.electron.invoke.videoDeleteFromChart(chart.id)
      if (result.success) {
        await this.catalogService.refreshCharts()
        await this.catalogService.refreshStats()
      } else {
        this.removalError = result.error || 'Failed to delete video'
      }
    } catch (err) {
      this.removalError = `Error: ${err}`
    }
    this.ref.detectChanges()
  }

  async deleteBackground(chart: ChartRecord): Promise<void> {
    if (!confirm(`Delete background from "${chart.artist} - ${chart.name}"?`)) return
    
    try {
      const result = await window.electron.invoke.artDeleteBackground(chart.id)
      if (result.success) {
        await this.catalogService.refreshCharts()
        await this.catalogService.refreshStats()
      } else {
        this.removalError = result.error || 'Failed to delete background'
      }
    } catch (err) {
      this.removalError = `Error: ${err}`
    }
    this.ref.detectChanges()
  }

  async deleteAlbumArt(chart: ChartRecord): Promise<void> {
    if (!confirm(`Delete album art from "${chart.artist} - ${chart.name}"?`)) return
    
    try {
      const result = await window.electron.invoke.artDeleteAlbumArt(chart.id)
      if (result.success) {
        await this.catalogService.refreshCharts()
        await this.catalogService.refreshStats()
      } else {
        this.removalError = result.error || 'Failed to delete album art'
      }
    } catch (err) {
      this.removalError = `Error: ${err}`
    }
    this.ref.detectChanges()
  }

  async deleteLyrics(chart: ChartRecord): Promise<void> {
    if (!confirm(`Delete lyrics from "${chart.artist} - ${chart.name}"?`)) return
    
    try {
      const result = await window.electron.invoke.lyricsDelete(chart.id)
      if (result.success) {
        await this.catalogService.refreshCharts()
        await this.catalogService.refreshStats()
      } else {
        this.removalError = result.error || 'Failed to delete lyrics'
      }
    } catch (err) {
      this.removalError = `Error: ${err}`
    }
    this.ref.detectChanges()
  }

  // Navigation methods - go to specific tabs with chart pre-selected
  goToVideo(chart: ChartRecord): void {
    // Store selected chart info for video tab to pick up
    sessionStorage.setItem('selectedChartForVideo', JSON.stringify({
      id: chart.id,
      name: chart.name,
      artist: chart.artist,
      path: chart.path,
      songLength: chart.songLength
    }))
    this.router.navigate(['/video'])
  }

  goToArt(chart: ChartRecord, type: 'album' | 'background'): void {
    sessionStorage.setItem('selectedChartForArt', JSON.stringify({
      id: chart.id,
      name: chart.name,
      artist: chart.artist,
      album: chart.album,
      path: chart.path,
      type
    }))
    this.router.navigate(['/art'])
  }

  goToLyrics(chart: ChartRecord): void {
    sessionStorage.setItem('selectedChartForLyrics', JSON.stringify({
      id: chart.id,
      name: chart.name,
      artist: chart.artist,
      album: chart.album,
      path: chart.path,
      chartType: chart.chartType
    }))
    this.router.navigate(['/lyrics'])
  }
}
