import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  FormField,
  FormSectionCard,
  FormSelect,
  Loader,
} from '../../components';
import { useDepartmentDirectory } from '../../api/departments';
import {
  useFundingSources,
  useIpNkrekpItems,
  useProcurementCategories,
  useProcurementKinds,
} from '../../api/procurementDirectories';
import { useProcurementStatusValues } from '../../api/procurementStatusValues';
import { ApiError } from '../../api/client';
import { useAppContext } from '../../context/app-context';
import {
  createProcurementPlanItem,
  deleteProcurementPlanItem,
  invalidateRpzQueries,
  updateProcurementPlanItem,
  usePlanItemContractDocuments,
  useProcurementPlanItem,
  type ProcurementPlanItemDetail,
  type ProcurementPlanItemUpdate,
} from '../../api/procurementPlanItems';
import { useHasRole } from '../../hooks/useUserAccess';
import { ADMIN_ROLE } from '../../mocks/roles';
import { paths } from '../../routes/paths';
import { OPEN_PLAN_YEAR, PROCUREMENT_STATUS_LABEL } from '../../utils/constants';
import { createEmptyRpzForm, type RpzFormData } from '../../types/rpzForm';

const NEED_TYPE_OPTIONS = [
  { value: 'annual', label: 'Щорічна' },
  { value: 'one_time', label: 'Разова' },
] as const;

function patchForm<K extends keyof RpzFormData>(
  setter: Dispatch<SetStateAction<RpzFormData>>,
  key: K,
  value: RpzFormData[K],
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

function deleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error) {
    return 'Не вдалося видалити пункт РПЗ.';
  }
  return '';
}

function statusLabel(status: string): string {
  if (status in PROCUREMENT_STATUS_LABEL) {
    return PROCUREMENT_STATUS_LABEL[status as keyof typeof PROCUREMENT_STATUS_LABEL];
  }
  return status;
}

function formatCost(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(uah).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} грн`;
}

function parseCostThousands(value: string): number | null {
  const cleaned = value.trim().replace(/грн/gi, '').replace(/\s/g, '').replace(',', '.');
  if (!cleaned) {
    return null;
  }
  const uah = Number(cleaned);
  if (!Number.isFinite(uah) || uah < 0) {
    return null;
  }
  return Math.round(uah) / 1000;
}

function planItemValidationMessage(form: RpzFormData): string {
  if (!form.subject.trim()) {
    return 'Вкажіть предмет закупівлі.';
  }
  if (!form.initiatorDepartment.trim()) {
    return 'Вкажіть підрозділ-ініціатор.';
  }
  if (parseCostThousands(form.expectedCost) === null) {
    return 'Вкажіть коректну очікувану вартість.';
  }
  if (!form.needType) {
    return 'Оберіть потребу.';
  }
  if (!form.status) {
    return 'Оберіть статус.';
  }
  return '';
}

function toPlanItemUpdate(form: RpzFormData): ProcurementPlanItemUpdate {
  const expectedCost = parseCostThousands(form.expectedCost) ?? 0;
  const closed = form.status.trim() === 'completed';
  return {
    department: form.initiatorDepartment.trim(),
    headFullName: form.headFullName.trim(),
    executorFullName: form.executorFullName.trim(),
    subject: form.subject.trim(),
    needType: form.needType.trim(),
    procurementKind: form.procurementType.trim(),
    category: form.category.trim(),
    fundingSource: form.fundingSource.trim(),
    ipItem: form.ipInkrekpItem.trim(),
    eventName: form.eventName.trim(),
    expectedCost,
    completionDate: form.completionDate,
    counterparty: form.counterparty.trim(),
    plannedTzSubmitDate: closed ? '' : form.plannedTzSubmitDate,
    plannedContractDate: closed ? '' : form.plannedContractDate,
    plannedWorkStartDate: closed ? '' : form.plannedWorkStartDate,
    buyer: form.responsibleBuyer.trim(),
    status: form.status.trim(),
  };
}

function toForm(item: ProcurementPlanItemDetail): RpzFormData {
  return {
    year: String(item.year),
    number: String(item.lineNumber),
    initiatorDepartment: item.department,
    headFullName: item.headFullName,
    executorFullName: item.executorFullName,
    subject: item.subject,
    needType: item.needType,
    procurementType: item.procurementKind,
    category: item.category,
    fundingSource: item.fundingSource,
    ipInkrekpItem: item.ipItem,
    eventName: item.eventName,
    expectedCost: formatCost(item.expectedCost),
    completionDate: item.completionDate,
    counterparty: item.counterparty,
    plannedTzSubmitDate: item.plannedTzSubmitDate,
    plannedContractDate: item.plannedContractDate,
    plannedWorkStartDate: item.plannedWorkStartDate,
    responsibleBuyer: item.buyer,
    status: item.status,
  };
}

export function RpzItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthReady, isLoggedIn, user } = useAppContext();
  const isAdmin = useHasRole(ADMIN_ROLE);
  const { id } = useParams<{ id: string }>();
  const isCreate = id === 'new';
  const { data: departmentDirectory, isLoading: isDepartmentsLoading } = useDepartmentDirectory(
    isLoggedIn,
    user?.id,
  );
  const { data: statusValues, isLoading: isStatusesQueryLoading } = useProcurementStatusValues(
    isAuthReady && isLoggedIn,
  );
  const isStatusesLoading = !isAuthReady || isStatusesQueryLoading;
  const directoriesEnabled = isAuthReady && isLoggedIn;
  const { data: procurementKinds, isLoading: isKindsQueryLoading } =
    useProcurementKinds(directoriesEnabled);
  const { data: procurementCategories, isLoading: isCategoriesQueryLoading } =
    useProcurementCategories(directoriesEnabled);
  const { data: fundingSources, isLoading: isFundingQueryLoading } =
    useFundingSources(directoriesEnabled);
  const { data: ipNkrekpItems, isLoading: isIpQueryLoading } = useIpNkrekpItems(directoriesEnabled);
  const isKindsLoading = !directoriesEnabled || isKindsQueryLoading;
  const isCategoriesLoading = !directoriesEnabled || isCategoriesQueryLoading;
  const isFundingLoading = !directoriesEnabled || isFundingQueryLoading;
  const isIpLoading = !directoriesEnabled || isIpQueryLoading;
  const { data: planItem, isLoading, isError } = useProcurementPlanItem(id ?? '', !isCreate);
  const {
    data: contractDocuments,
    isLoading: isContractDocumentsLoading,
    isError: isContractDocumentsError,
  } = usePlanItemContractDocuments(id ?? '', !isCreate);
  const [createForm, setCreateForm] = useState<RpzFormData>(createEmptyRpzForm);
  const [editDraft, setEditDraft] = useState<{ id: string; form: RpzFormData } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const draft = editDraft && editDraft.id === id ? editDraft.form : null;
  const mode = draft ? 'edit' : 'view';
  const viewForm = planItem ? toForm(planItem) : createEmptyRpzForm();
  const form = isCreate ? createForm : (draft ?? viewForm);

  const saveChanges = useMutation({
    mutationFn: (body: Parameters<typeof updateProcurementPlanItem>[1]) =>
      updateProcurementPlanItem(id ?? '', body),
    onSuccess: async () => {
      await invalidateRpzQueries(queryClient);
      setEditDraft(null);
      setSaveError('');
    },
    onError: (error: unknown) => {
      setSaveError(error instanceof ApiError ? error.message : 'Не вдалося зберегти зміни.');
    },
  });
  const isSaving = saveChanges.isPending;
  const createItem = useMutation({
    mutationFn: createProcurementPlanItem,
    onSuccess: async (created) => {
      await invalidateRpzQueries(queryClient);
      setSaveError('');
      navigate(`${paths.rpz}/${created.id}`);
    },
    onError: (error: unknown) => {
      setSaveError(error instanceof ApiError ? error.message : 'Не вдалося зберегти пункт РПЗ.');
    },
  });
  const isCreating = createItem.isPending;
  const deleteItem = useMutation({
    mutationFn: () => deleteProcurementPlanItem(id ?? ''),
    onSuccess: () => {
      setDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['procurement_plan_items'] });
      navigate(paths.rpz);
    },
  });
  const isDeleting = deleteItem.isPending;
  const readOnly = isCreate ? isCreating : mode !== 'edit' || isSaving;
  const isClosed = form.status === 'completed';
  const deleteError = deleteErrorMessage(deleteItem.error);

  function setField<K extends keyof RpzFormData>(key: K, value: RpzFormData[K]) {
    if (isCreate) {
      patchForm(setCreateForm, key, value);
      return;
    }
    setEditDraft((prev) =>
      prev && prev.id === id ? { id, form: { ...prev.form, [key]: value } } : prev,
    );
  }

  function startEdit() {
    if (!planItem || !id) {
      return;
    }
    setEditDraft({ id, form: toForm(planItem) });
    setSaveError('');
  }

  function cancelEdit() {
    setEditDraft(null);
    setSaveError('');
  }

  function saveEdit() {
    if (!draft || !id) {
      return;
    }
    const message = planItemValidationMessage(draft);
    if (message) {
      setSaveError(message);
      return;
    }
    setSaveError('');
    saveChanges.mutate(toPlanItemUpdate(draft));
  }

  const departmentItems = useMemo(() => {
    const options = (departmentDirectory ?? []).map((department) => ({
      value: department.name,
      label: department.name,
    }));
    if (
      form.initiatorDepartment &&
      !options.some((item) => item.value === form.initiatorDepartment)
    ) {
      options.unshift({ value: form.initiatorDepartment, label: form.initiatorDepartment });
    }
    return options;
  }, [departmentDirectory, form.initiatorDepartment]);

  const procurementKindItems = useMemo(() => {
    const options = (procurementKinds ?? []).map((name) => ({ value: name, label: name }));
    if (form.procurementType && !options.some((item) => item.value === form.procurementType)) {
      options.unshift({ value: form.procurementType, label: form.procurementType });
    }
    return options;
  }, [form.procurementType, procurementKinds]);

  const categoryItems = useMemo(() => {
    const options = (procurementCategories ?? []).map((name) => ({ value: name, label: name }));
    if (form.category && !options.some((item) => item.value === form.category)) {
      options.unshift({ value: form.category, label: form.category });
    }
    return options;
  }, [form.category, procurementCategories]);

  const fundingSourceItems = useMemo(() => {
    const options = (fundingSources ?? []).map((name) => ({ value: name, label: name }));
    if (form.fundingSource && !options.some((item) => item.value === form.fundingSource)) {
      options.unshift({ value: form.fundingSource, label: form.fundingSource });
    }
    return options;
  }, [form.fundingSource, fundingSources]);

  const ipNkrekpItemOptions = useMemo(() => {
    const options = (ipNkrekpItems ?? []).map((name) => ({ value: name, label: name }));
    if (form.ipInkrekpItem && !options.some((item) => item.value === form.ipInkrekpItem)) {
      options.unshift({ value: form.ipInkrekpItem, label: form.ipInkrekpItem });
    }
    return options;
  }, [form.ipInkrekpItem, ipNkrekpItems]);

  const statusItems = useMemo(
    () =>
      (statusValues ?? []).map((status) => ({
        value: status,
        label: statusLabel(status),
      })),
    [statusValues],
  );

  const pageTitle = useMemo(() => {
    if (isCreate) {
      return 'Новий пункт РПЗ';
    }
    if (form.year && form.number) {
      return `${form.year} · ${form.number}`;
    }
    return 'Пункт РПЗ';
  }, [form.number, form.year, isCreate]);

  function saveCreate() {
    const message = planItemValidationMessage(form);
    if (message) {
      setSaveError(message);
      return;
    }
    setSaveError('');
    createItem.mutate({
      ...toPlanItemUpdate(form),
      year: Number(OPEN_PLAN_YEAR),
    });
  }

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
          {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
        </div>
        {isCreate ? (
          <div className="flex shrink-0">
            <Button text="Зберегти" disabled={isCreating} onClick={saveCreate} />
          </div>
        ) : null}
        {!isCreate && planItem && mode === 'view' ? (
          <div className="flex shrink-0 gap-2">
            {isAdmin ? (
              <Button
                text="Видалити"
                variant="danger"
                onClick={() => {
                  deleteItem.reset();
                  setDeleteOpen(true);
                }}
              />
            ) : null}
            {isClosed && !isAdmin ? (
              <span className="group relative inline-flex">
                <Button
                  text="Редагувати"
                  disabled
                  className="pointer-events-none"
                  aria-describedby="completed-edit-hint"
                />
                <span id="completed-edit-hint" className="sr-only">
                  Ця закупівля не підлягає редагуванню, тому що вона вже завершена.
                </span>
                <span
                  role="tooltip"
                  className={[
                    'pointer-events-none absolute top-full right-0 z-20 mt-2 hidden w-64',
                    'rounded-lg bg-[var(--color-text-primary)] p-2.5 text-left text-xs leading-snug',
                    'text-[var(--color-surface)] shadow-xl',
                    'group-hover:block group-focus-within:block',
                  ].join(' ')}
                >
                  Ця закупівля не підлягає редагуванню, тому що вона вже завершена.
                </span>
              </span>
            ) : (
              <Button text="Редагувати" onClick={startEdit} />
            )}
          </div>
        ) : null}
        {!isCreate && mode === 'edit' ? (
          <div className="flex shrink-0 gap-2">
            <Button text="Відмінити" variant="secondary" disabled={isSaving} onClick={cancelEdit} />
            <Button text="Зберегти" disabled={isSaving} onClick={saveEdit} />
          </div>
        ) : null}
      </div>

      {!isCreate && isLoading ? (
        <div className="flex justify-center py-16">
          <Loader size={28} />
        </div>
      ) : !isCreate && (isError || !planItem) ? (
        <p className="text-sm text-[var(--color-text-muted)]">Не вдалося завантажити пункт РПЗ.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormSectionCard title="Ініціатор">
            {isCreate ? (
              <FormSelect
                label="Рік"
                disabled
                items={[{ value: OPEN_PLAN_YEAR, label: OPEN_PLAN_YEAR }]}
                value={OPEN_PLAN_YEAR}
                onChange={() => undefined}
              />
            ) : null}
            <FormSelect
              label="Підрозділ-ініціатор"
              placeholder="Оберіть підрозділ"
              isLoading={isDepartmentsLoading}
              disabled={readOnly}
              items={departmentItems}
              value={form.initiatorDepartment}
              onChange={(v) => setField('initiatorDepartment', v)}
            />
            <FormField
              label="ПІБ керівника підрозділу"
              value={form.headFullName}
              disabled={readOnly}
              onChange={(v) => setField('headFullName', v)}
            />
            <FormField
              label="ПІБ виконавця від ініціатора"
              value={form.executorFullName}
              disabled={readOnly}
              onChange={(v) => setField('executorFullName', v)}
            />
          </FormSectionCard>

          <FormSectionCard title="Виконання">
            <FormField
              label="Відповідальний закупник"
              value={form.responsibleBuyer}
              disabled={readOnly}
              onChange={(v) => setField('responsibleBuyer', v)}
            />
            <FormSelect
              label="Статус"
              placeholder="Оберіть статус"
              isLoading={isStatusesLoading}
              disabled={readOnly}
              items={statusItems}
              value={form.status}
              onChange={(v) => setField('status', v)}
            />
          </FormSectionCard>

          <FormSectionCard title="Закупівля">
            <FormField
              label="Предмет закупівлі"
              value={form.subject}
              disabled={readOnly}
              onChange={(v) => setField('subject', v)}
            />
            <FormSelect
              label="Потреба (щорічна / разова)"
              placeholder="Оберіть потребу"
              disabled={readOnly}
              items={NEED_TYPE_OPTIONS}
              value={form.needType}
              onChange={(v) => setField('needType', v)}
            />
            <FormSelect
              label="Вид закупівлі"
              placeholder="Оберіть вид закупівлі"
              isLoading={isKindsLoading}
              disabled={readOnly}
              items={procurementKindItems}
              value={form.procurementType}
              onChange={(v) => setField('procurementType', v)}
            />
            <FormSelect
              label="Категорія"
              placeholder="Оберіть категорію"
              isLoading={isCategoriesLoading}
              disabled={readOnly}
              items={categoryItems}
              value={form.category}
              onChange={(v) => setField('category', v)}
            />
            <FormSelect
              label="Джерело фінансування"
              placeholder="Оберіть джерело фінансування"
              isLoading={isFundingLoading}
              disabled={readOnly}
              items={fundingSourceItems}
              value={form.fundingSource}
              onChange={(v) => setField('fundingSource', v)}
            />
            <FormSelect
              label="Пункт ІП ІНКРЕКП"
              placeholder="Оберіть пункт ІП"
              isLoading={isIpLoading}
              disabled={readOnly}
              items={ipNkrekpItemOptions}
              value={form.ipInkrekpItem}
              onChange={(v) => setField('ipInkrekpItem', v)}
            />
            <FormField
              label="Назва заходу"
              value={form.eventName}
              disabled={readOnly}
              onChange={(v) => setField('eventName', v)}
            />
            <FormField
              label="Очікувана вартість"
              value={form.expectedCost}
              disabled={readOnly}
              onChange={(v) => setField('expectedCost', v)}
            />
          </FormSectionCard>

          <FormSectionCard title="Попередній договір і строки">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {isCreate || !isContractDocumentsLoading ? null : <Loader size={18} />}
                {!isCreate && isContractDocumentsError ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Не вдалося завантажити ДД.
                  </p>
                ) : null}
                {isCreate ||
                (!isContractDocumentsLoading &&
                  !isContractDocumentsError &&
                  (contractDocuments?.length ?? 0) === 0) ? (
                  <p className="text-sm text-[var(--color-text-muted)]">ДД ще немає</p>
                ) : null}
                {!isCreate && (contractDocuments?.length ?? 0) > 0 ? (
                  <ul className="space-y-2">
                    {contractDocuments?.map((document) => (
                      <li key={document.id}>
                        <Link
                          to={`${paths.procurements}/${document.id}`}
                          className="block text-sm font-medium text-[var(--color-brand-600)] hover:underline"
                        >
                          {document.seqNumber !== null ? `№ ${document.seqNumber} · ` : ''}
                          {document.subject}
                        </Link>
                        {document.contractor || document.contractDate ? (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {[document.contractor, document.contractDate]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {!isCreate && planItem && planItem.status !== 'completed' ? (
                <button
                  type="button"
                  aria-label="Додати ДД"
                  onClick={() => navigate(`${paths.procurements}/new?planItemId=${id}`)}
                  className={[
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    'bg-[var(--color-brand-600)] text-lg leading-none font-semibold text-white',
                    'hover:bg-[var(--color-brand-700)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  ].join(' ')}
                >
                  +
                </button>
              ) : null}
            </div>
            {isClosed ? (
              <p className="text-sm text-[var(--color-text-muted)]">Закупівля завершена</p>
            ) : (
              <>
                <FormField
                  label="Планова дата подачі ТЗ"
                  type="date"
                  value={form.plannedTzSubmitDate}
                  disabled={readOnly}
                  onChange={(v) => setField('plannedTzSubmitDate', v)}
                />
                <FormField
                  label="Планова дата укладання нового договору"
                  type="date"
                  value={form.plannedContractDate}
                  disabled={readOnly}
                  onChange={(v) => setField('plannedContractDate', v)}
                />
                <FormField
                  label="Планова дата початку робіт/послуг"
                  type="date"
                  value={form.plannedWorkStartDate}
                  disabled={readOnly}
                  onChange={(v) => setField('plannedWorkStartDate', v)}
                />
              </>
            )}
          </FormSectionCard>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Видалити пункт"
        message={`Видалити пункт ${pageTitle} з річного плану закупівель?`}
        confirmText="Видалити"
        pending={isDeleting}
        error={deleteError}
        onConfirm={() => deleteItem.mutate()}
        onClose={() => {
          if (!isDeleting) {
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}
