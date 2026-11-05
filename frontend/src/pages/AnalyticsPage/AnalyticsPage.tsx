import { BigCard } from '../../components';
import { CategoryAnalysisSection } from './CategoryAnalysisSection';
import { CostAnalysisSection } from './CostAnalysisSection';
import { DynamicsAnalysisSection } from './DynamicsAnalysisSection';
import { ProcurementMethodsSection } from './ProcurementMethodsSection';
import { SavingsAnalysisSection } from './SavingsAnalysisSection';
import { ANALYTICS_SECTIONS } from './analyticsSections';

export function AnalyticsPage() {
  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Аналітика
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Зведені звіти та візуалізації закупівель
        </p>
      </div>

      <div className="space-y-8">
        {ANALYTICS_SECTIONS.map((section, index) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
            <BigCard className="flex h-[37rem] flex-col">
              {section.id === 'cost-analysis' ? (
                <CostAnalysisSection
                  index={index}
                  titleId={`${section.id}-title`}
                  label={section.label}
                  description={section.description}
                />
              ) : section.id === 'savings-analysis' ? (
                <SavingsAnalysisSection
                  index={index}
                  titleId={`${section.id}-title`}
                  label={section.label}
                  description={section.description}
                />
              ) : section.id === 'categories' ? (
                <CategoryAnalysisSection
                  index={index}
                  titleId={`${section.id}-title`}
                  label={section.label}
                  description={section.description}
                />
              ) : section.id === 'procurement-methods' ? (
                <ProcurementMethodsSection
                  index={index}
                  titleId={`${section.id}-title`}
                  label={section.label}
                  description={section.description}
                />
              ) : (
                <DynamicsAnalysisSection
                  index={index}
                  titleId={`${section.id}-title`}
                  label={section.label}
                  description={section.description}
                />
              )}
            </BigCard>
          </section>
        ))}
      </div>
    </div>
  );
}
