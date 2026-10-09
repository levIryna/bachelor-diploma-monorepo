import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, FormField, FormSectionCard } from '../../components';
import { getRpzFormById } from '../../mocks/rpzFormData';
import { paths } from '../../routes/paths';
import { createEmptyRpzForm, type RpzFormData, type RpzFormMode } from '../../types/rpzForm';

function patchForm<K extends keyof RpzFormData>(
  setter: Dispatch<SetStateAction<RpzFormData>>,
  key: K,
  value: RpzFormData[K],
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

export function RpzItemPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = id === 'new';

  const initialMode: RpzFormMode = isCreate ? 'create' : 'view';
  const [mode, setMode] = useState<RpzFormMode>(initialMode);
  const [form, setForm] = useState<RpzFormData>(() =>
    isCreate ? createEmptyRpzForm() : createEmptyRpzForm(),
  );

  useEffect(() => {
    if (isCreate) {
      setForm(createEmptyRpzForm());
      setMode('create');
      return;
    }

    if (!id) {
      return;
    }

    const loaded = getRpzFormById(id);
    if (loaded) {
      setForm(loaded);
      setMode('view');
    }
  }, [id, isCreate]);

  const readOnly = mode === 'view';
  const showSave = mode === 'edit' || mode === 'create';

  const pageTitle = useMemo(() => {
    if (isCreate) {
      return 'Новий пункт РПЗ';
    }
    if (form.year && form.number) {
      return `${form.year} · ${form.number}`;
    }
    return 'Пункт РПЗ';
  }, [form.number, form.year, isCreate]);

  const handleSave = () => {
    if (mode === 'create') {
      navigate(paths.rpz);
      return;
    }
    setMode('view');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            to={paths.rpz}
            className="inline-block text-sm font-medium text-[var(--color-brand-600)] hover:underline"
          >
            ← Назад до списку РПЗ
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {pageTitle}
          </h1>
        </div>
        {mode === 'view' && !isCreate ? (
          <Button text="Редагувати" onClick={() => setMode('edit')} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormSectionCard title="Ініціатор">
          <FormField
            label="Підрозділ-ініціатор"
            value={form.initiatorDepartment}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'initiatorDepartment', v)}
          />
          <FormField
            label="ПІБ керівника підрозділу"
            value={form.headFullName}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'headFullName', v)}
          />
          <FormField
            label="ПІБ виконавця від ініціатора"
            value={form.executorFullName}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'executorFullName', v)}
          />
        </FormSectionCard>

        <FormSectionCard title="Виконання">
          <FormField
            label="Відповідальний закупник"
            value={form.responsibleBuyer}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'responsibleBuyer', v)}
          />
          <FormField
            label="Статус"
            value={form.status}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'status', v)}
          />
        </FormSectionCard>

        <FormSectionCard title="Закупівля">
          <FormField
            label="Предмет закупівлі"
            value={form.subject}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'subject', v)}
          />
          <FormField
            label="Потреба (щорічна / разова)"
            value={form.needType}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'needType', v)}
          />
          <FormField
            label="Вид закупівлі"
            value={form.procurementType}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'procurementType', v)}
          />
          <FormField
            label="Категорія"
            value={form.category}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'category', v)}
          />
          <FormField
            label="Джерело фінансування"
            value={form.fundingSource}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'fundingSource', v)}
          />
          <FormField
            label="Пункт ІП ІНКРЕКП"
            value={form.ipInkrekpItem}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'ipInkrekpItem', v)}
          />
          <FormField
            label="Назва заходу"
            value={form.eventName}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'eventName', v)}
          />
          <FormField
            label="Очікувана вартість"
            value={form.expectedCost}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'expectedCost', v)}
          />
        </FormSectionCard>

        <FormSectionCard title="Попередній договір і строки">
          <FormField
            label="Дата завершення"
            type="date"
            value={form.completionDate}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'completionDate', v)}
          />
          <FormField
            label="Контрагент"
            value={form.counterparty}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'counterparty', v)}
          />
          <FormField
            label="Планова дата подачі ТЗ"
            type="date"
            value={form.plannedTzSubmitDate}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'plannedTzSubmitDate', v)}
          />
          <FormField
            label="Планова дата укладання нового договору"
            type="date"
            value={form.plannedContractDate}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'plannedContractDate', v)}
          />
          <FormField
            label="Планова дата початку робіт/послуг"
            type="date"
            value={form.plannedWorkStartDate}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'plannedWorkStartDate', v)}
          />
        </FormSectionCard>
      </div>

      {showSave ? (
        <div className="flex justify-end border-t border-[var(--color-border)] pt-6">
          <Button text="Зберегти" onClick={handleSave} />
        </div>
      ) : null}
    </div>
  );
}
