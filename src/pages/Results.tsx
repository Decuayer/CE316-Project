/**
 * Results page entry point.
 *
 * Bu dosya artık yalnızca bir re-export wrapper'dır.
 * Gerçek implementasyon src/pages/results/ dizinindedir:
 *
 *   results/index.tsx          → Proje listesi (ResultsIndex)
 *   results/ResultsProject.tsx → Proje öğrenci listesi
 *   results/ResultsStudentDetail.tsx → Öğrenci detay
 *
 * App.tsx içindeki `import Results from './pages/Results'` ifadesi
 * bu re-export sayesinde çalışmaya devam eder.
 */
export { default } from './results/index';
