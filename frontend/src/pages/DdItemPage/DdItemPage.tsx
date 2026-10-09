import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, FormField, FormSectionCard } from '../../components';
import { getDdFormById } from '../../mocks/ddFormData';
import { paths } from '../../routes/paths';
import { createEmptyDdForm, type DdFormData, type DdFormMode } from '../../types/ddForm';

function patchForm<K extends keyof DdFormData>(
  setter: Dispatch<SetStateAction<DdFormData>>,
  key: K,
  value: DdFormData[K],
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

export function DdItemPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = id === 'new';

  const [mode, setMode] = useState<DdFormMode>(isCreate ? 'create' : 'view');
  const [form, setForm] = useState<DdFormData>(createEmptyDdForm);

  useEffect(() => {
    if (isCreate) {
      setForm(createEmptyDdForm());
      setMode('create');
      return;
    }

    if (!id) {
      return;
    }

    const loaded = getDdFormById(id);
    if (loaded) {
      setForm(loaded);
      setMode('view');
    }
  }, [id, isCreate]);

  const readOnly = mode === 'view';

  const pageTitle = useMemo(() => {
    if (isCreate) {
      return 'Новий ДД';
    }
    if (form.year && form.number) {
      return `${form.year} · ${form.number}`;
    }
    return 'Договірна документація';
  }, [form.number, form.year, isCreate]);

  const actionLabel = mode === 'view' ? 'Редагувати' : 'Зберегти';

  const handleAction = () => {
    if (mode === 'view') {
      setMode('edit');
      return;
    }

    if (mode === 'create') {
      navigate(paths.procurements);
      return;
    }

    setMode('view');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            to={paths.procurements}
            className="inline-block text-sm font-medium text-[var(--color-brand-600)] hover:underline"
          >
            ← Назад до списку ДД
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {pageTitle}
          </h1>
        </div>
        <Button text={actionLabel} onClick={handleAction} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormSectionCard title="Зв’язок з РПЗ">
          <FormField
            label="№ по порядку"
            value={form.orderNumber}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'orderNumber', v)}
          />
          <FormField
            label="РПЗ: рік + пункт"
            value={form.rpzYearItem}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'rpzYearItem', v)}
          />
          <FormField
            label="Предмет закупівлі"
            value={form.procurementSubject}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'procurementSubject', v)}
          />
        </FormSectionCard>

        <FormSectionCard title="Заявка і процедура">
          <FormField
            label="Очікувана вартість за заявкою, тис. грн"
            value={form.expectedCostThousands}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'expectedCostThousands', v)}
          />
          <FormField
            label="Вид процедури"
            value={form.procedureType}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'procedureType', v)}
          />
          <FormField
            label="Підрозділ ініціатора"
            value={form.initiatorDepartment}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'initiatorDepartment', v)}
          />
          <FormField
            label="ПІБ: ТЗ, тех. експерт, кошторисник, закупник"
            value={form.responsiblePersons}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'responsiblePersons', v)}
          />
          <FormField
            label="Фактичний термін надання заявки"
            type="date"
            value={form.actualApplicationDeadline}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'actualApplicationDeadline', v)}
          />
          <FormField
            label="Номер процедури, посилання ЕТМ"
            value={form.procedureNumberEtm}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'procedureNumberEtm', v)}
          />
        </FormSectionCard>

        <FormSectionCard title="Договір">
          <FormField
            label="Акцепт. контрагент"
            value={form.acceptedCounterparty}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'acceptedCounterparty', v)}
          />
          <FormField
            label="Предмет договору"
            value={form.contractSubject}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'contractSubject', v)}
          />
          <FormField
            label="Сума договору, грн без ПДВ"
            value={form.contractAmount}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'contractAmount', v)}
          />
          <FormField
            label="Дата укладання, тип ДД"
            value={form.signingDateAndType}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'signingDateAndType', v)}
          />
          <FormField
            label="Початок / кінець дії"
            value={form.validityPeriod}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'validityPeriod', v)}
          />
          <FormField
            label="Примітки / зміни до ДД"
            value={form.notesAndAmendments}
            disabled={readOnly}
            onChange={(v) => patchForm(setForm, 'notesAndAmendments', v)}
          />
        </FormSectionCard>
      </div>
    </div>
  );
}
