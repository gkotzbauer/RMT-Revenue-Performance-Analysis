// Healthcare Revenue Analyzer - Main Application Controller
// Repository: https://github.com/gkotzbauer/RMT-Revenue-Performance-Analysis
// Author: Statistical analysis with proper methodology
// Version: 1.0.0

import { HealthcareAnalyzer } from './analyzer.js';
import { UIManager } from './ui-manager.js';
import { ChartManager } from './charts.js';
import { ExportManager } from './export.js';

class HealthcareRevenueApp {
    constructor() {
        this.analyzer = new HealthcareAnalyzer();
        this.uiManager = new UIManager();
        this.chartManager = new ChartManager();
        this.exportManager = new ExportManager();
        this.analysisResults = null;
        
        this.init();
    }

    init() {
        console.log('🏥 Healthcare Revenue Analyzer v1.0.0');
        console.log('Repository: RMT-Revenue-Performance-Analysis');
        console.log('Initializing application...');
        
        this.setupEventListeners();
        this.showUploadSection();
        this.setupResponsiveCharts();
    }

    setupEventListeners() {
        // File upload events
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            
            // Drag and drop events
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        }
        
        // Export buttons
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const exportExcelBtn = document.getElementById('export-excel-btn');
        const downloadReportBtn = document.getElementById('download-report-btn');
        
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => this.exportCSV());
        if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => this.exportExcel());
        if (downloadReportBtn) downloadReportBtn.addEventListener('click', () => this.downloadReport());
        
        // Action buttons
        const newAnalysisBtn = document.getElementById('new-analysis-btn');
        if (newAnalysisBtn) newAnalysisBtn.addEventListener('click', () => this.resetApp());
        
        // Modal events
        const aboutBtn = document.getElementById('about-btn');
        const closeModal = document.getElementById('close-modal');
        
        if (aboutBtn) aboutBtn.addEventListener('click', () => this.showAboutModal());
        if (closeModal) closeModal.addEventListener('click', () => this.hideAboutModal());
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterResults(e.target.value));
        }
        
        // Click outside modal to close
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target.id === 'about-modal') {
                    this.hideAboutModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            this.hideAboutModal();
        }
        
        // Ctrl+U to upload (if on upload screen)
        if (e.ctrlKey && e.key === 'u' && this.getCurrentSection() === 'upload') {
            e.preventDefault();
            document.getElementById('file-input')?.click();
        }
        
        // Ctrl+E to export (if results are available)
        if (e.ctrlKey && e.key === 'e' && this.analysisResults) {
            e.preventDefault();
            this.exportCSV();
        }
    }

    getCurrentSection() {
        if (!document.getElementById('upload-section').classList.contains('hidden')) return 'upload';
        if (!document.getElementById('loading-section').classList.contains('hidden')) return 'loading';
        if (!document.getElementById('results-section').classList.contains('hidden')) return 'results';
        return 'unknown';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        document.getElementById('upload-area').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('upload-area').classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('upload-area').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!this.validateFile(file)) {
            return;
        }

        try {
            this.showLoadingSection();
            await this.runAnalysis(file);
        } catch (error) {
            console.error('Analysis failed:', error);
            this.uiManager.showError('Analysis failed: ' + error.message);
            this.showUploadSection();
        }
    }

    validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/vnd.ms-excel.sheet.macroEnabled.12',
            'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
        ];
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            this.uiManager.showError('Please upload an Excel file (.xlsx or .xls)');
            return false;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            this.uiManager.showError('File size must be less than 50MB');
            return false;
        }
        
        return true;
    }

    async runAnalysis(file) {
        const loadingStatus = document.getElementById('loading-status');
        const progressFill = document.getElementById('progress-fill');
        
        try {
            // Step 1: Read file
            loadingStatus.textContent = 'Reading Excel file...';
            progressFill.style.width = '10%';
            await this.delay(500);
            
            // Step 2: Clean data
            loadingStatus.textContent = 'Cleaning and processing data...';
            progressFill.style.width = '25%';
            
            const cleanedData = await this.analyzer.loadAndCleanData(file);
            await this.delay(500);
            
            // Step 3: Aggregate
            loadingStatus.textContent = 'Aggregating weekly data...';
            progressFill.style.width = '40%';
            
            const weeklyData = this.analyzer.aggregateByWeek(cleanedData);
            await this.delay(500);
            
            // Step 4: Feature engineering
            loadingStatus.textContent = 'Engineering features...';
            progressFill.style.width = '55%';
            
            const features = this.analyzer.engineerFeatures(weeklyData);
            await this.delay(500);
            
            // Step 5: Train/test split
            loadingStatus.textContent = 'Creating train/test split...';
            progressFill.style.width = '70%';
            
            const { trainData, testData, trainCorrelations } = this.analyzer.createTrainTestSplit(features);
            await this.delay(500);
            
            // Step 6: Model development
            loadingStatus.textContent = 'Building predictive models...';
            progressFill.style.width = '85%';
            
            const models = this.analyzer.developModels(trainData, testData);
            const { results, bestModel, trainStats } = this.analyzer.evaluateModels(models, testData);
            await this.delay(500);
            
            // Step 7: Final analysis
            loadingStatus.textContent = 'Generating insights...';
            progressFill.style.width = '95%';
            
            const performanceResults = this.analyzer.classifyPerformance(features, bestModel, trainStats);
            const finalResults = this.analyzer.generateDetailedAnalysis(performanceResults, features);
            
            progressFill.style.width = '100%';
            loadingStatus.textContent = 'Analysis complete!';
            await this.delay(500);
            
            // Store results
            this.analysisResults = {
                methodology: 'Proper train/test split with statistical validation',
                bestModel: bestModel,
                trainCorrelations: trainCorrelations,
                performanceResults: performanceResults,
                finalResults: finalResults,
                modelResults: results,
                benchmarks: {
                    totalWeeks: features.length,
                    avgAccuracy: ((1 - bestModel.mae / _.meanBy(features, 'totalPayments')) * 100).toFixed(1) + '%',
                    modelMAE: bestModel.mae
                }
            };
            
            this.showResults();
            
        } catch (error) {
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    showUploadSection() {
        this.uiManager.hideAllSections();
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
            uploadSection.classList.add('fade-in');
        }
    }

    showLoadingSection() {
        this.uiManager.hideAllSections();
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.classList.remove('hidden');
            loadingSection.classList.add('fade-in');
        }
    }

    showResults() {
        this.uiManager.hideAllSections();
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.classList.add('fade-in');
        }
        
        this.populateResults();
        this.chartManager.createCharts(this.analysisResults);
        this.setupTableFeatures();
    }

    populateResults() {
        if (!this.analysisResults) return;
        
        const results = this.analysisResults;
        
        // Update summary cards with animation
        this.animateValue('total-weeks', 0, results.benchmarks.totalWeeks);
        
        const accuracyEl = document.getElementById('model-accuracy');
        if (accuracyEl) accuracyEl.textContent = results.benchmarks.avgAccuracy;
        
        const errorEl = document.getElementById('average-error');
        if (errorEl) errorEl.textContent = `$${Math.round(results.bestModel.mae).toLocaleString()}`;
        
        const modelEl = document.getElementById('best-model');
        if (modelEl) modelEl.textContent = results.bestModel.modelName;
        
        // Populate key drivers
        this.populateKeyDrivers();
        
        // Populate recommendations
        this.populateRecommendations();
        
        // Populate results table
        this.populateResultsTable();
    }

    populateKeyDrivers() {
        const driversContainer = document.getElementById('key-drivers');
        if (!driversContainer) return;
        
        const correlations = this.analysisResults.trainCorrelations;
        
        const drivers = Object.entries(correlations)
            .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
            .slice(0, 4)
            .map(([feature, correlation]) => ({
                name: this.formatFeatureName(feature),
                correlation: correlation,
                impact: this.getImpactLevel(Math.abs(correlation))
            }));
        
        driversContainer.innerHTML = drivers.map(driver => `
            <div class="insight-item">
                <div class="insight-title">${driver.name}</div>
                <div class="insight-description">
                    Correlation: ${driver.correlation.toFixed(3)} - ${driver.impact} impact on revenue
                </div>
            </div>
        `).join('');
    }

    populateRecommendations() {
        const recommendationsContainer = document.getElementById('recommendations');
        if (!recommendationsContainer) return;
        
        const correlations = this.analysisResults.trainCorrelations;
        const recommendations = [];
        
        // Generate dynamic recommendations based on correlation analysis
        if (Math.abs(correlations.totalVisitCount || 0) > 0.8) {
            recommendations.push({
                title: "Optimize Visit Volume",
                description: `Focus on increasing patient visits as the primary revenue driver (${(Math.abs(correlations.totalVisitCount) * 100).toFixed(1)}% correlation)`
            });
        }
        
        if (Math.abs(correlations.totalChargeAmount || 0) > 0.8) {
            recommendations.push({
                title: "Enhance Charge Capture",
                description: `Improve charge amount processes and coding accuracy (${(Math.abs(correlations.totalChargeAmount) * 100).toFixed(1)}% correlation)`
            });
        }
        
        if (Math.abs(correlations.bcbsChargesPct || 0) > 0.3) {
            recommendations.push({
                title: "BCBS Payer Strategy",
                description: "Increase proportion of BCBS patients for higher reimbursement rates"
            });
        }
        
        if (Math.abs(correlations.aetnaChargesPct || 0) > 0.3) {
            recommendations.push({
                title: "Aetna Partnership Focus",
                description: "Leverage Aetna relationships for improved revenue performance"
            });
        }
        
        // Default recommendations if no strong correlations
        if (recommendations.length === 0) {
            recommendations.push(
                {
                    title: "Volume Optimization",
                    description: "Focus on increasing patient visit volume for revenue growth"
                },
                {
                    title: "Collection Efficiency",
                    description: "Standardize collection processes based on best-performing weeks"
                }
            );
        }
        
        recommendationsContainer.innerHTML = recommendations.slice(0, 4).map(rec => `
            <div class="insight-item">
                <div class="insight-title">${rec.title}</div>
                <div class="insight-description">${rec.description}</div>
            </div>
        `).join('');
    }

    populateResultsTable() {
        const tbody = document.getElementById('results-tbody');
        if (!tbody) return;
        
        const results = this.analysisResults.finalResults;
        
        tbody.innerHTML = results.map(result => `
            <tr>
                <td>${result.Year}</td>
                <td>${result.Week}</td>
                <td>$${parseFloat(result['Actual Total Payments']).toLocaleString()}</td>
                <td>$${parseFloat(result['Predicted Total Payments']).toLocaleString()}</td>
                <td>${result['Percent Error']}</td>
                <td>
                    <span class="performance-badge performance-${result['Performance Diagnostic'].toLowerCase().replace(' ', '-')}">
                        ${result['Performance Diagnostic']}
                    </span>
                </td>
                <td class="text-small">${this.truncateText(result['What Went Well'], 150)}</td>
                <td class="text-small">${this.truncateText(result['What Could Be Improved'], 150)}</td>
                <td class="text-small">${this.truncateText(result['BCBS Analysis'], 120)}</td>
                <td class="text-small">${this.truncateText(result['Aetna Analysis'], 120)}</td>
            </tr>
        `).join('');
    }

    setupTableFeatures() {
        // Setup search functionality
        this.uiManager.addTableSearch('search-input', 'results-table');
        
        // Setup table sorting
        this.uiManager.addTableSorting('results-table');
    }

    filterResults(searchTerm) {
        const rows = document.querySelectorAll('#results-tbody tr');
        const term = searchTerm.toLowerCase();
        
        let visibleCount = 0;
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(term);
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });
        
        // Update search results info
        this.updateSearchInfo(visibleCount, rows.length);
    }

    updateSearchInfo(visible, total) {
        let searchInfo = document.getElementById('search-info');
        if (!searchInfo) {
            searchInfo = document.createElement('div');
            searchInfo.id = 'search-info';
            searchInfo.className = 'search-info';
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput.parentElement) {
                searchInput.parentElement.appendChild(searchInfo);
            }
        }
        
        if (visible === total) {
            searchInfo.textContent = '';
        } else {
            searchInfo.textContent = `Showing ${visible} of ${total} results`;
        }
    }

    formatFeatureName(feature) {
        const names = {
            'totalChargeAmount': 'Total Charge Amount',
            'totalVisitCount': 'Total Visit Count',
            'weightedAvgCollectionPct': 'Collection Rate',
            'avgPaymentPerVisit': 'Payment Per Visit',
            'bcbsChargesPct': 'BCBS Percentage',
            'aetnaChargesPct': 'Aetna Percentage',
            'selfPayChargesPct': 'Self-Pay Percentage'
        };
        return names[feature] || feature;
    }

    getImpactLevel(correlation) {
        if (correlation > 0.8) return 'Very High';
        if (correlation > 0.6) return 'High';
        if (correlation > 0.4) return 'Moderate';
        if (correlation > 0.2) return 'Low';
        return 'Minimal';
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async exportCSV() {
        if (!this.analysisResults) {
            this.uiManager.showError('No analysis results to export');
            return;
        }
        
        try {
            await this.exportManager.exportToCSV(this.analysisResults.finalResults);
            this.uiManager.showSuccess('Results exported to CSV successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.uiManager.showError('Export failed: ' + error.message);
        }
    }

    async exportExcel() {
        if (!this.analysisResults) {
            this.uiManager.showError('No analysis results to export');
            return;
        }
        
        try {
            await this.exportManager.exportToExcel(this.analysisResults.finalResults);
            this.uiManager.showSuccess('Results exported to Excel successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.uiManager.showError('Export failed: ' + error.message);
        }
    }

    async downloadReport() {
        if (!this.analysisResults) {
            this.uiManager.showError('No analysis results to download');
            return;
        }
        
        try {
            await this.exportManager.generateReport(this.analysisResults);
            this.uiManager.showSuccess('Report downloaded successfully!');
        } catch (error) {
            console.error('Report generation failed:', error);
            this.uiManager.showError('Report generation failed: ' + error.message);
        }
    }

    showAboutModal() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideAboutModal() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    resetApp() {
        this.analysisResults = null;
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
        // Clear any charts
        this.chartManager.destroyAllCharts();
        
        // Reset progress
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = '0%';
        
        this.showUploadSection();
        this.uiManager.showInfo('Ready for new analysis');
    }

    setupResponsiveCharts() {
        // Setup chart responsiveness
        this.chartManager.setupResponsiveCharts();
        
        // Handle window resize
        window.addEventListener('resize', _.debounce(() => {
            this.chartManager.resizeCharts();
        }, 250));
    }

    animateValue(elementId, start, end, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * easeOut;
            
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Error handling and logging
    handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        
        const errorMessage = error.message || 'An unexpected error occurred';
        this.uiManager.showError(`${context}: ${errorMessage}`);
        
        // Log to console for debugging
        console.trace('Error stack trace:', error);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.healthcareApp = new HealthcareRevenueApp();
        console.log('🎉 Healthcare Revenue Analyzer initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Healthcare Revenue Analyzer:', error);
    }
});

// Export for module usage
export { HealthcareRevenueApp };
