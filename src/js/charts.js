// Healthcare Revenue Analyzer - Chart Manager
// Repository: https://github.com/gkotzbauer/RMT-Revenue-Performance-Analysis
// Handles all data visualizations using Chart.js
// Author: Professional chart implementation for healthcare analytics
// Version: 1.0.0

export class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#2563eb',
            primaryLight: '#3b82f6',
            secondary: '#64748b',
            success: '#059669',
            successLight: '#10b981',
            warning: '#d97706',
            warningLight: '#f59e0b',
            error: '#dc2626',
            errorLight: '#ef4444',
            info: '#0891b2',
            background: '#f8fafc',
            border: '#e2e8f0'
        };
        
        console.log('📊 ChartManager v1.0.0 initialized');
    }

    createCharts(analysisResults) {
        if (!analysisResults) {
            console.error('❌ No analysis results provided for charts');
            return;
        }

        console.log('📈 Creating interactive charts...');
        
        try {
            // Create main dashboard charts
            this.createPerformanceDistributionChart(analysisResults);
            this.createCorrelationChart(analysisResults);
            
            // Create additional charts if space available
            if (document.getElementById('time-series-chart')) {
                this.createTimeSeriesChart(analysisResults);
            }
            
            if (document.getElementById('model-comparison-chart')) {
                this.createModelComparisonChart(analysisResults);
            }
            
            console.log('✅ All charts created successfully');
            
        } catch (error) {
            console.error('❌ Error creating charts:', error);
        }
    }

    createPerformanceDistributionChart(analysisResults) {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) {
            console.warn('⚠️ Performance chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        // Calculate performance distribution from results
        const performanceData = _.countBy(analysisResults.performanceResults, 'performanceDiagnostic');
        
        const labels = Object.keys(performanceData);
        const data = Object.values(performanceData);
        const total = _.sum(data);
        const percentages = data.map(value => ((value / total) * 100).toFixed(1));

        // Define colors for each performance category
        const backgroundColors = labels.map(label => {
            switch (label) {
                case 'Over Performed':
                    return this.colors.success;
                case 'Under Performed':
                    return this.colors.error;
                case 'Average Performance':
                    return this.colors.warning;
                default:
                    return this.colors.secondary;
            }
        });

        const borderColors = backgroundColors.map(color => this.darkenColor(color, 10));

        this.charts.performance = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverBackgroundColor: backgroundColors.map(color => this.lightenColor(color, 15)),
                    hoverBorderWidth: 3,
                    hoverBorderColor: borderColors.map(color => this.darkenColor(color, 20))
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                family: 'Inter, sans-serif',
                                weight: '500'
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, index) => ({
                                    text: `${label} (${percentages[index]}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[index],
                                    strokeStyle: data.datasets[0].borderColor[index],
                                    lineWidth: 2,
                                    pointStyle: 'circle',
                                    hidden: false,
                                    index: index
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.border,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value} weeks (${percentage}%)`;
                            },
                            afterLabel: (context) => {
                                const label = context.label;
                                if (label === 'Over Performed') {
                                    return 'Revenue exceeded predictions by >2.5%';
                                } else if (label === 'Under Performed') {
                                    return 'Revenue fell short of predictions by >2.5%';
                                } else {
                                    return 'Revenue within ±2.5% of predictions';
                                }
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                elements: {
                    arc: {
                        borderJoinStyle: 'round'
                    }
                }
            }
        });

        console.log('✅ Performance distribution chart created');
    }

    createCorrelationChart(analysisResults) {
        const canvas = document.getElementById('correlation-chart');
        if (!canvas) {
            console.warn('⚠️ Correlation chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.correlation) {
            this.charts.correlation.destroy();
        }

        const correlations = analysisResults.trainCorrelations;
        if (!correlations) {
            console.warn('⚠️ No correlation data available');
            return;
        }

        // Prepare data for horizontal bar chart
        const labels = Object.keys(correlations).map(key => this.formatFeatureName(key));
        const data = Object.values(correlations);
        
        // Sort by absolute correlation value (descending)
        const sortedData = labels.map((label, index) => ({
            label,
            value: data[index],
            absValue: Math.abs(data[index])
        })).sort((a, b) => b.absValue - a.absValue);

        const sortedLabels = sortedData.map(item => item.label);
        const sortedValues = sortedData.map(item => item.value);

        // Color bars based on correlation strength and direction
        const backgroundColors = sortedValues.map(value => {
            const absValue = Math.abs(value);
            if (absValue > 0.8) {
                return value > 0 ? this.colors.success : this.colors.error;
            } else if (absValue > 0.6) {
                return value > 0 ? this.colors.successLight : this.colors.errorLight;
            } else if (absValue > 0.4) {
                return value > 0 ? this.colors.warning : this.colors.warningLight;
            } else {
                return this.colors.secondary;
            }
        });

        const borderColors = backgroundColors.map(color => this.darkenColor(color, 15));

        this.charts.correlation = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: 'Correlation with Total Payments',
                    data: sortedValues,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.border,
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.x;
                                const impact = this.getCorrelationImpact(Math.abs(value));
                                const direction = value > 0 ? 'Positive' : 'Negative';
                                return [
                                    `Correlation: ${value.toFixed(3)}`,
                                    `Impact: ${impact}`,
                                    `Direction: ${direction}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        min: -1,
                        max: 1,
                        grid: {
                            color: this.colors.border,
                            lineWidth: 1
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif',
                                size: 11
                            },
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Correlation Coefficient',
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12,
                                weight: '600'
                            },
                            color: this.colors.secondary
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif',
                                size: 11
                            },
                            maxRotation: 0,
                            color: this.colors.secondary
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart',
                    delay: (context) => {
                        return context.dataIndex * 100; // Stagger animation
                    }
                }
            }
        });

        console.log('✅ Correlation chart created');
    }

    createTimeSeriesChart(analysisResults) {
        const canvas = document.getElementById('time-series-chart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.timeSeries) {
            this.charts.timeSeries.destroy();
        }

        const data = analysisResults.performanceResults;
        
        // Prepare time series data
        const timeData = data.map(item => ({
            x: `${item.year}-${item.week}`,
            actual: item.actualPayments,
            predicted: item.predictedPayments
        }));

        this.charts.timeSeries = new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Actual Payments',
                        data: timeData.map(d => ({ x: d.x, y: d.actual })),
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '20',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: this.colors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Predicted Payments',
                        data: timeData.map(d => ({ x: d.x, y: d.predicted })),
                        borderColor: this.colors.warning,
                        backgroundColor: this.colors.warning + '20',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: this.colors.warning,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Actual vs Predicted Payments Over Time',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 16,
                            weight: '600'
                        },
                        color: this.colors.secondary
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Inter, sans-serif'
                            },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Week',
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            color: this.colors.border
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total Payments ($)',
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12,
                                weight: '600'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: this.colors.border
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });

        console.log('✅ Time series chart created');
    }

    createModelComparisonChart(analysisResults) {
        const canvas = document.getElementById('model-comparison-chart');
        if (!canvas) return;

        if (this.charts.modelComparison) {
            this.charts.modelComparison.destroy();
        }

        const modelResults = analysisResults.modelResults;
        if (!modelResults || modelResults.length === 0) return;

        const labels = modelResults.map(model => model.modelName);
        const maeData = modelResults.map(model => model.mae);
        const accuracyData = modelResults.map(model => model.accuracy || 0);

        this.charts.modelComparison = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Mean Absolute Error ($)',
                        data: maeData,
                        backgroundColor: this.colors.primary + '80',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Accuracy (%)',
                        data: accuracyData,
                        backgroundColor: this.colors.success + '80',
                        borderColor: this.colors.success,
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Model Performance Comparison',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 16,
                            weight: '600'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label.includes('Error')) {
                                    return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                                } else {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Mean Absolute Error ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Accuracy (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });

        console.log('✅ Model comparison chart created');
    }

    // Utility methods for chart styling and management
    formatFeatureName(feature) {
        const names = {
            'totalChargeAmount': 'Charge Amount',
            'totalVisitCount': 'Visit Count',
            'weightedAvgCollectionPct': 'Collection Rate',
            'avgPaymentPerVisit': 'Payment/Visit',
            'bcbsChargesPct': 'BCBS %',
            'aetnaChargesPct': 'Aetna %',
            'selfPayChargesPct': 'Self-Pay %',
            'chargesPerVisit': 'Charges/Visit',
            'highValuePayerPct': 'High-Value Payers %',
            'commercialChargesPct': 'Commercial %'
        };
        return names[feature] || feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    getCorrelationImpact(correlation) {
        if (correlation > 0.8) return 'Very High';
        if (correlation > 0.6) return 'High';
        if (correlation > 0.4) return 'Moderate';
        if (correlation > 0.2) return 'Low';
        return 'Minimal';
    }

    lightenColor(color, percent) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Lighten
        const newR = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
        const newG = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
        const newB = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    darkenColor(color, percent) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Darken
        const newR = Math.max(0, Math.floor(r * (100 - percent) / 100));
        const newG = Math.max(0, Math.floor(g * (100 - percent) / 100));
        const newB = Math.max(0, Math.floor(b * (100 - percent) / 100));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    updateChart(chartId, newData) {
        const chart = this.charts[chartId];
        if (!chart) {
            console.warn(`⚠️ Chart ${chartId} not found`);
            return;
        }

        chart.data = newData;
        chart.update('active');
    }

    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
            console.log(`🗑️ Chart ${chartId} destroyed`);
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
        console.log('🗑️ All charts destroyed');
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Setup responsive behavior
    setupResponsiveCharts() {
        window.addEventListener('resize', _.debounce(() => {
            this.resizeCharts();
        }, 250));

        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCharts();
            }, 500);
        });
    }

    // Export chart as image
    exportChart(chartId, filename = null) {
        const chart = this.charts[chartId];
        if (!chart) {
            console.warn(`⚠️ Chart ${chartId} not found for export`);
            return;
        }

        try {
            const url = chart.toBase64Image('image/png', 1.0);
            const link = document.createElement('a');
            link.download = filename || `${chartId}-chart.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`📷 Chart ${chartId} exported as ${filename || chartId + '-chart.png'}`);
        } catch (error) {
            console.error(`❌ Failed to export chart ${chartId}:`, error);
        }
    }

    // Export all charts
    exportAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            this.exportChart(chartId, `healthcare-${chartId}-chart.png`);
        });
    }

    // Get chart configuration for saving/loading
    getChartConfig(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return null;
        
        return {
            type: chart.config.type,
            data: chart.data,
            options: chart.options
        };
    }

    // Create custom chart with user-defined options
    createCustomChart(canvasId, chartConfig) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`⚠️ Canvas ${canvasId} not found`);
            return;
        }

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        try {
            this.charts[canvasId] = new Chart(canvas, chartConfig);
            console.log(`✅ Custom chart created: ${canvasId}`);
        } catch (error) {
            console.error(`❌ Failed to create custom chart ${canvasId}:`, error);
        }
    }

    // Animation helpers
    animateChartIn(chartId, delay = 0) {
        setTimeout(() => {
            const chart = this.charts[chartId];
            if (chart) {
                chart.update('active');
            }
        }, delay);
    }

    // Chart theme management
    applyDarkTheme() {
        this.colors = {
            ...this.colors,
            background: '#1e293b',
            border: '#334155',
            secondary: '#94a3b8'
        };
        
        // Update existing charts with dark theme
        Object.values(this.charts).forEach(chart => {
            if (chart.options.plugins) {
                chart.options.plugins.legend = {
                    ...chart.options.plugins.legend,
                    labels: {
                        ...chart.options.plugins.legend.labels,
                        color: this.colors.secondary
                    }
                };
                chart.update();
            }
        });
    }

    applyLightTheme() {
        this.colors = {
            ...this.colors,
            background: '#f8fafc',
            border: '#e2e8f0',
            secondary: '#64748b'
        };
        
        // Update existing charts with light theme
        Object.values(this.charts).forEach(chart => {
            if (chart.options.plugins) {
                chart.options.plugins.legend = {
                    ...chart.options.plugins.legend,
                    labels: {
                        ...chart.options.plugins.legend.labels,
                        color: this.colors.secondary
                    }
                };
                chart.update();
            }
        });
    }
}
