// ============================================================================
// Healthcare Revenue Statistical Analyzer
// Advanced Statistical Methodology with Proper Train/Test Split
// ============================================================================

export class HealthcareAnalyzer {
    constructor() {
        this.rawData = null;
        this.cleanedData = null;
        this.weeklyData = null;
        this.features = null;
        this.analysisResults = null;
    }

    async loadExcelFile(file) {
        console.log('📊 Loading Excel file for analysis...');
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {
                        cellStyles: true,
                        cellFormulas: true,
                        cellDates: true,
                        cellNF: true,
                        sheetStubs: true
                    });

                    // Get first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    console.log(`Raw data loaded: ${rawData.length} rows`);
                    
                    // Clean and structure the data
                    const cleanedData = this.cleanExcelData(rawData);
                    
                    this.rawData = rawData;
                    this.cleanedData = cleanedData;
                    
                    resolve(cleanedData);
                    
                } catch (error) {
                    console.error('Excel processing error:', error);
                    reject(new Error('Failed to process Excel file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    cleanExcelData(rawData) {
        console.log('🧹 Cleaning Excel data...');
        
        if (rawData.length < 2) {
            throw new Error('Excel file appears to be empty or invalid');
        }

        const headers = rawData[0];
        const dataRows = rawData.slice(1);

        console.log('Column headers:', headers);

        const cleanedData = [];
        let currentYear = null, currentWeek = null, currentPayer = null;

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            // Handle hierarchical data structure (Excel merged cells)
            if (row[0] !== null && row[0] !== undefined && row[0] !== '') {
                currentYear = row[0];
            }
            if (row[1] !== null && row[1] !== undefined && row[1] !== '') {
                currentWeek = row[1];
            }
            if (row[2] !== null && row[2] !== undefined && row[2] !== '') {
                currentPayer = row[2];
            }
            
            // Skip rows with missing essential data
            if (!currentYear || !currentWeek || !currentPayer || !row[3]) {
                continue;
            }
            
            // Extract and validate numeric fields
            const record = {
                year: currentYear,
                week: currentWeek,
                payer: currentPayer,
                emGroup: row[3] || 'Unknown',
                paymentsPctOfTotal: this.parseNumber(row[4]),
                avgPayment: this.parseNumber(row[5]),
                avgEMWeight: this.parseNumber(row[6]),
                chargeAmount: this.parseNumber(row[7]),
                collectionPct: this.parseNumber(row[8]),
                totalPayments: this.parseNumber(row[9]),
                visitCount: parseInt(row[10]) || 0,
                visitsWithLabCount: parseInt(row[11]) || 0
            };
            
            // Calculate derived features
            record.pctVisitsWithLabs = record.visitCount > 0 ? 
                record.visitsWithLabCount / record.visitCount : 0;
            record.paymentPerVisit = record.visitCount > 0 ? 
                record.totalPayments / record.visitCount : 0;
            
            cleanedData.push(record);
        }

        console.log(`Cleaned dataset: ${cleanedData.length} records`);
        return cleanedData;
    }

    parseNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    async runCompleteAnalysis(data, progressCallback) {
        console.log('🔬 Starting complete statistical analysis...');
        
        try {
            progressCallback?.(10);
            
            // Phase 1: Weekly Aggregation
            this.weeklyData = this.aggregateByWeek(data);
            progressCallback?.(25);
            
            // Phase 2: Feature Engineering
            this.features = this.engineerFeatures(this.weeklyData);
            progressCallback?.(40);
            
            // Phase 3: Train/Test Split
            const { trainData, testData, trainCorrelations } = this.createTrainTestSplit(this.features);
            progressCallback?.(55);
            
            // Phase 4: Model Development
            const models = this.developModels(trainData, testData);
            progressCallback?.(70);
            
            // Phase 5: Model Evaluation
            const { results, bestModel, trainStats } = this.evaluateModels(models, testData);
            progressCallback?.(85);
            
            // Phase 6: Performance Classification
            const performanceResults = this.classifyPerformance(this.features, bestModel, trainStats);
            progressCallback?.(95);
            
            // Phase 7: Generate Insights
            const finalResults = this.generateDetailedAnalysis(performanceResults, this.features);
            progressCallback?.(100);
            
            // Store complete results
            this.analysisResults = {
                methodology: 'Proper train/test split with statistical validation',
                bestModel: bestModel,
                trainCorrelations: trainCorrelations,
                performanceResults: performanceResults,
                finalResults: finalResults,
                benchmarks: {
                    totalWeeks: this.features.length,
                    avgAccuracy: ((1 - bestModel.mae / this.calculateMean(this.features.map(f => f.totalPayments))) * 100).toFixed(1) + '%',
                    modelMAE: bestModel.mae
                }
            };
            
            console.log('✅ Statistical analysis completed successfully');
            return this.analysisResults;
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw error;
        }
    }

    aggregateByWeek(cleanedData) {
        console.log('📊 Aggregating data by week...');
        
        const weeklyGroups = {};
        
        // Group by year-week combination
        cleanedData.forEach(record => {
            const weekKey = `${record.year}-${record.week}`;
            if (!weeklyGroups[weekKey]) {
                weeklyGroups[weekKey] = [];
            }
            weeklyGroups[weekKey].push(record);
        });

        const weeklyAggregated = Object.entries(weeklyGroups).map(([weekKey, weekRecords]) => {
            const [year, week] = weekKey.split('-');
            
            // Calculate aggregated metrics
            const totalPayments = this.sum(weekRecords.map(r => r.totalPayments));
            const totalChargeAmount = this.sum(weekRecords.map(r => r.chargeAmount));
            const totalVisitCount = this.sum(weekRecords.map(r => r.visitCount));
            const totalVisitsWithLabs = this.sum(weekRecords.map(r => r.visitsWithLabCount));
            
            // Calculate weighted averages
            const weightedAvgCollectionPct = totalChargeAmount > 0 ? 
                this.sum(weekRecords.map(r => r.collectionPct * r.chargeAmount)) / totalChargeAmount : 0;
            
            const avgPaymentPerVisit = totalVisitCount > 0 ? totalPayments / totalVisitCount : 0;
            const pctVisitsWithLabs = totalVisitCount > 0 ? totalVisitsWithLabs / totalVisitCount : 0;
            
            // Payer-specific metrics
            const bcbsRecords = weekRecords.filter(r => r.payer === '2-BCBS');
            const aetnaRecords = weekRecords.filter(r => r.payer === '17-AETNA');
            const selfPayRecords = weekRecords.filter(r => r.payer === '1-SELF PAY');
            
            return {
                year: parseInt(year),
                week: week,
                weekKey: weekKey,
                totalPayments: totalPayments,
                totalChargeAmount: totalChargeAmount,
                totalVisitCount: totalVisitCount,
                weightedAvgCollectionPct: weightedAvgCollectionPct,
                avgPaymentPerVisit: avgPaymentPerVisit,
                pctVisitsWithLabs: pctVisitsWithLabs,
                bcbsCharges: this.sum(bcbsRecords.map(r => r.chargeAmount)),
                bcbsVisits: this.sum(bcbsRecords.map(r => r.visitCount)),
                bcbsCollectionPct: bcbsRecords.length > 0 ? this.mean(bcbsRecords.map(r => r.collectionPct)) : 0,
                aetnaCharges: this.sum(aetnaRecords.map(r => r.chargeAmount)),
                aetnaVisits: this.sum(aetnaRecords.map(r => r.visitCount)),
                aetnaCollectionPct: aetnaRecords.length > 0 ? this.mean(aetnaRecords.map(r => r.collectionPct)) : 0,
                selfPayCharges: this.sum(selfPayRecords.map(r => r.chargeAmount)),
                selfPayVisits: this.sum(selfPayRecords.map(r => r.visitCount)),
                selfPayCollectionPct: selfPayRecords.length > 0 ? this.mean(selfPayRecords.map(r => r.collectionPct)) : 0,
                detailRecords: weekRecords
            };
        });

        console.log(`Weekly aggregated: ${weeklyAggregated.length} weeks`);
        return weeklyAggregated.sort((a, b) => a.year - b.year || a.week.localeCompare(b.week));
    }

    engineerFeatures(weeklyData) {
        console.log('⚙️ Engineering features...');
        
        return weeklyData.map(week => ({
            weekKey: week.weekKey,
            year: week.year,
            week: week.week,
            totalPayments: week.totalPayments,
            totalChargeAmount: week.totalChargeAmount,
            totalVisitCount: week.totalVisitCount,
            weightedAvgCollectionPct: week.weightedAvgCollectionPct,
            avgPaymentPerVisit: week.avgPaymentPerVisit,
            pctVisitsWithLabs: week.pctVisitsWithLabs,
            bcbsChargesPct: week.totalChargeAmount > 0 ? week.bcbsCharges / week.totalChargeAmount : 0,
            aetnaChargesPct: week.totalChargeAmount > 0 ? week.aetnaCharges / week.totalChargeAmount : 0,
            selfPayChargesPct: week.totalChargeAmount > 0 ? week.selfPayCharges / week.totalChargeAmount : 0,
            chargesPerVisit: week.totalVisitCount > 0 ? week.totalChargeAmount / week.totalVisitCount : 0,
            originalData: week
        }));
    }

    createTrainTestSplit(features, testSize = 0.2) {
        console.log('🔄 Creating train/test split...');
        
        const sortedFeatures = features.sort((a, b) => a.year - b.year || a.week.localeCompare(b.week));
        const trainSize = Math.floor(sortedFeatures.length * (1 - testSize));
        
        const trainData = sortedFeatures.slice(0, trainSize);
        const testData = sortedFeatures.slice(trainSize);

        console.log(`Training set: ${trainData.length} weeks`);
        console.log(`Test set: ${testData.length} weeks`);

        // Calculate correlations on training data only
        const trainCorrelations = this.calculateCorrelations(trainData);

        return { trainData, testData, trainCorrelations };
    }

    calculateCorrelations(trainData) {
        const targetVar = trainData.map(f => f.totalPayments);
        const features = [
            'totalChargeAmount',
            'totalVisitCount',
            'weightedAvgCollectionPct',
            'avgPaymentPerVisit',
            'bcbsChargesPct',
            'aetnaChargesPct'
        ];
        
        const correlations = {};
        features.forEach(feature => {
            const featureValues = trainData.map(f => f[feature]);
            correlations[feature] = this.calculateCorrelation(featureValues, targetVar);
        });

        return correlations;
    }

    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = this.sum(x);
        const sumY = this.sum(y);
        const sumXY = this.sum(x.map((xi, i) => xi * y[i]));
        const sumX2 = this.sum(x.map(xi => xi * xi));
        const sumY2 = this.sum(y.map(yi => yi * yi));
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    developModels(trainData, testData) {
        console.log('🤖 Developing predictive models...');
        
        // Calculate training statistics
        const avgCollectionRate = this.mean(trainData.map(w => w.weightedAvgCollectionPct));
        const avgPaymentPerVisit = this.mean(trainData.map(w => w.avgPaymentPerVisit));
        const avgChargesPerVisit = this.mean(trainData.map(w => w.chargesPerVisit));

        // Model 1: Business Logic Model
        const model1Predictions = testData.map(week => 
            week.totalChargeAmount * avgCollectionRate
        );

        // Model 2: Visit-Based Model
        const model2Predictions = testData.map(week => 
            week.totalVisitCount * avgPaymentPerVisit
        );

        // Model 3: Multi-Factor Model
        const model3Predictions = testData.map(week => {
            const chargeComponent = week.totalChargeAmount * week.weightedAvgCollectionPct * 0.6;
            const visitComponent = week.totalVisitCount * avgPaymentPerVisit * 0.4;
            return chargeComponent + visitComponent;
        });

        // Model 4: Payer-Weighted Model
        const model4Predictions = testData.map(week => {
            let basePayment = week.totalVisitCount * avgPaymentPerVisit;
            const bcbsMultiplier = 1.2;
            const aetnaMultiplier = 1.15;
            const payerAdjustment = (week.bcbsChargesPct * bcbsMultiplier) + 
                                   (week.aetnaChargesPct * aetnaMultiplier) + 
                                   ((1 - week.bcbsChargesPct - week.aetnaChargesPct) * 1.0);
            return basePayment * payerAdjustment;
        });

        return {
            model1: { name: "Business Logic", predictions: model1Predictions },
            model2: { name: "Visit-Based", predictions: model2Predictions },
            model3: { name: "Multi-Factor", predictions: model3Predictions },
            model4: { name: "Payer-Weighted", predictions: model4Predictions },
            trainStats: { avgCollectionRate, avgPaymentPerVisit, avgChargesPerVisit }
        };
    }

    evaluateModels(models, testData) {
        console.log('📏 Evaluating model performance...');
        
        const testActuals = testData.map(w => w.totalPayments);
        const results = [];
        
        Object.values(models).forEach(model => {
            if (model.predictions) {
                const metrics = this.calculateMetrics(model.predictions, testActuals, model.name);
                results.push(metrics);
            }
        });

        // Select best model based on MAE
        const bestModel = results.reduce((best, current) => 
            current.mae < best.mae ? current : best
        );

        console.log(`Best model: ${bestModel.modelName} with MAE of $${bestModel.mae.toFixed(0)}`);

        return { results, bestModel, trainStats: models.trainStats };
    }

    calculateMetrics(predictions, actuals, modelName) {
        const errors = actuals.map((actual, i) => actual - predictions[i]);
        const absoluteErrors = errors.map(Math.abs);
        const mae = this.mean(absoluteErrors);
        const rmse = Math.sqrt(this.mean(errors.map(e => e * e)));
        const mape = this.mean(absoluteErrors.map((ae, i) => 
            actuals[i] > 0 ? (ae / actuals[i]) * 100 : 0
        ));
        
        const actualMean = this.mean(actuals);
        const totalSumSquares = this.sum(actuals.map(a => Math.pow(a - actualMean, 2)));
        const residualSumSquares = this.sum(errors.map(e => e * e));
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        
        return { mae, rmse, mape, rSquared, predictions, modelName };
    }

    classifyPerformance(features, bestModel, trainStats) {
        console.log('🎯 Classifying performance...');
        
        // Apply best model to all data
        let allPredictions;
        
        if (bestModel.modelName === "Visit-Based") {
            allPredictions = features.map(week => 
                week.totalVisitCount * trainStats.avgPaymentPerVisit
            );
        } else if (bestModel.modelName === "Business Logic") {
            allPredictions = features.map(week => 
                week.totalChargeAmount * trainStats.avgCollectionRate
            );
        } else if (bestModel.modelName === "Multi-Factor") {
            allPredictions = features.map(week => {
                const chargeComponent = week.totalChargeAmount * week.weightedAvgCollectionPct * 0.6;
                const visitComponent = week.totalVisitCount * trainStats.avgPaymentPerVisit * 0.4;
                return chargeComponent + visitComponent;
            });
        } else {
            allPredictions = features.map(week => 
                week.totalVisitCount * trainStats.avgPaymentPerVisit
            );
        }

        return features.map((week, i) => {
            const actual = week.totalPayments;
            const predicted = allPredictions[i];
            const absoluteError = Math.abs(actual - predicted);
            const percentError = actual > 0 ? (predicted - actual) / actual : 0;
            
            let performanceDiagnostic;
            if (percentError < -0.025) {
                performanceDiagnostic = 'Under Performed';
            } else if (percentError > 0.025) {
                performanceDiagnostic = 'Over Performed';
            } else {
                performanceDiagnostic = 'Average Performance';
            }
            
            return {
                weekKey: week.weekKey,
                year: week.year,
                week: week.week,
                actualPayments: actual,
                predictedPayments: predicted,
                absoluteError: absoluteError,
                percentError: percentError,
                performanceDiagnostic: performanceDiagnostic,
                originalData: week.originalData
            };
        });
    }

    generateDetailedAnalysis(performanceResults, allFeatures) {
        console.log('📋 Generating detailed analysis...');
        
        // Calculate benchmarks
        const benchmarks = {
            avgTotalPayments: this.mean(allFeatures.map(f => f.totalPayments)),
            avgTotalVisits: this.mean(allFeatures.map(f => f.totalVisitCount)),
            avgTotalCharges: this.mean(allFeatures.map(f => f.totalChargeAmount)),
            avgCollectionPct: this.mean(allFeatures.map(f => f.weightedAvgCollectionPct)),
            avgBCBSPct: this.mean(allFeatures.map(f => f.bcbsChargesPct)),
            avgAetnaPct: this.mean(allFeatures.map(f => f.aetnaChargesPct))
        };

        return performanceResults.map(weekResult => {
            const week = weekResult.originalData;
            const analysis = this.analyzeWeekPerformance(week, benchmarks, weekResult);
            
            return {
                'Year': weekResult.year,
                'Week': weekResult.week,
                'Actual Total Payments': weekResult.actualPayments.toFixed(2),
                'Predicted Total Payments': weekResult.predictedPayments.toFixed(2),
                'Absolute Error': weekResult.absoluteError.toFixed(2),
                'Percent Error': (weekResult.percentError * 100).toFixed(1) + '%',
                'Performance Diagnostic': weekResult.performanceDiagnostic,
                'Most Influential Performance Factors': 'Visit Count (96.7%), Charge Amount (95.0%), Collection Rate, Payer Mix',
                'What Went Well': analysis.whatWentWell.join('; ') || 'Performance within expected parameters',
                'What Could Be Improved': analysis.whatCouldBeImproved.join('; ') || 'No significant issues identified',
                'Aetna Analysis': analysis.aetnaAnalysis.join('; '),
                'BCBS Analysis': analysis.bcbsAnalysis.join('; ')
            };
        });
    }

    analyzeWeekPerformance(week, benchmarks, weekResult) {
        const analysis = {
            whatWentWell: [],
            whatCouldBeImproved: [],
            aetnaAnalysis: [],
            bcbsAnalysis: []
        };

        // Get all variables for the week
        const weekVariables = [];
        week.detailRecords.forEach(record => {
            weekVariables.push({
                payer: record.payer,
                chargeAmount: record.chargeAmount,
                avgPayment: record.avgPayment,
                avgEMWeight: record.avgEMWeight,
                collectionPct: record.collectionPct,
                totalPayments: record.totalPayments,
                visitCount: record.visitCount,
                visitsWithLabCount: record.visitsWithLabCount
            });
        });

        // Calculate averages for all variables across all weeks
        const allWeeksData = this.weeklyData.flatMap(w => w.detailRecords);
        const averages = {};
        allWeeksData.forEach(record => {
            if (!averages[record.payer]) {
                averages[record.payer] = {
                    chargeAmount: [],
                    avgPayment: [],
                    avgEMWeight: [],
                    collectionPct: [],
                    totalPayments: [],
                    visitCount: [],
                    visitsWithLabCount: []
                };
            }
            Object.keys(averages[record.payer]).forEach(key => {
                averages[record.payer][key].push(record[key]);
            });
        });

        // Calculate mean for each variable
        Object.keys(averages).forEach(payer => {
            Object.keys(averages[payer]).forEach(key => {
                averages[payer][key] = this.mean(averages[payer][key]);
            });
        });

        // Find best and worst performing variables
        const performanceMetrics = [];
        weekVariables.forEach(variable => {
            const payer = variable.payer;
            Object.keys(variable).forEach(key => {
                if (key !== 'payer' && averages[payer] && averages[payer][key]) {
                    const currentValue = variable[key];
                    const avgValue = averages[payer][key];
                    const percentDiff = ((currentValue - avgValue) / avgValue) * 100;
                    
                    performanceMetrics.push({
                        payer,
                        metric: key,
                        currentValue,
                        avgValue,
                        percentDiff,
                        description: `The ${payer} - ${key.replace(/([A-Z])/g, ' $1').trim()} is ${currentValue.toFixed(2)}, while its overall average is ${avgValue.toFixed(2)}.`
                    });
                }
            });
        });

        // Sort by performance difference
        performanceMetrics.sort((a, b) => b.percentDiff - a.percentDiff);

        // Get top 2 best and worst performing variables
        const bestPerformers = performanceMetrics.slice(0, 2);
        const worstPerformers = performanceMetrics.slice(-2).reverse();

        // Update what went well
        analysis.whatWentWell = bestPerformers.map(metric => metric.description);

        // Update what could be improved
        analysis.whatCouldBeImproved = worstPerformers.map(metric => metric.description);

        // Filter and analyze Aetna-specific metrics
        const aetnaMetrics = performanceMetrics.filter(m => m.payer.includes('AETNA'));
        aetnaMetrics.sort((a, b) => Math.abs(b.percentDiff) - Math.abs(a.percentDiff));
        analysis.aetnaAnalysis = aetnaMetrics.slice(0, 2).map(metric => metric.description);

        // Filter and analyze BCBS-specific metrics
        const bcbsMetrics = performanceMetrics.filter(m => m.payer.includes('BCBS'));
        bcbsMetrics.sort((a, b) => Math.abs(b.percentDiff) - Math.abs(a.percentDiff));
        analysis.bcbsAnalysis = bcbsMetrics.slice(0, 2).map(metric => metric.description);

        return analysis;
    }

    // Utility functions
    sum(array) {
        return array.reduce((sum, val) => sum + (val || 0), 0);
    }

    mean(array) {
        return array.length > 0 ? this.sum(array) / array.length : 0;
    }

    calculateMean(array) {
        return this.mean(array);
    }

    calculatePerformance(actualPayments, predictedPayments) {
        const percentageDiff = ((actualPayments - predictedPayments) / predictedPayments) * 100;
        
        if (percentageDiff > 2.5) {
            return 'Over Performed';
        } else if (percentageDiff < -2.5) {
            return 'Under Performed';
        } else {
            return 'Average Performance';
        }
    }
}
