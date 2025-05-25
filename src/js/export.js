// Called from main.js after analysis
this.chartManager.createCharts(this.analysisResults);

// Export functionality
this.chartManager.exportChart('performance', 'revenue-performance.png');
this.chartManager.exportAllCharts(); // Export all charts
