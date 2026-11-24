import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  FormField,
  FormSectionCard,
  FormSelect,
  Loader,
} from '../../components';
import { useDepartmentDirectory } from '../../api/departments';
import { useBuyers } from '../../api/users';
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
import { useCanEditProcurement, useHasRole } from '../../hooks/useUserAccess';
import { ADMIN_ROLE } from '../../mocks/roles';
import { readRpzListSearch } from '../RpzListPage/RpzListPage';
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
  const [whole, fraction = ''] = Math.abs(valueThousands).toFixed(3).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const trimmedFraction = fraction.replace(/0+$/, '');
  return trimmedFraction ? `${grouped},${trimmedFraction}` : grouped;
}

function parseCostThousands(value: string): number | null {
  const cleaned = value
    .trim()
    .replace(/тис\.?/gi, '')
    .replace(/грн/gi, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  if (!cleaned) {
    return null;
  }
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return null;
  }
  const thousands = Number(cleaned);
  if (!Number.isFinite(thousands) || thousands < 0) {
    return null;
  }
  return thousands;
}

const FIELD_ERROR_ORDER = [
  'initiatorDepartment',
  'headFullName',
  'executorFullName',
  'responsibleBuyer',
  'status',
  'subject',
  'needType',
  'procurementType',
  'category',
  'fundingSource',
  'ipInkrekpItem',
  'expectedCost',
] as const;

type PlanItemErrorField = (typeof FIELD_ERROR_ORDER)[number];
type PlanItemFieldErrors = Partial<Record<PlanItemErrorField, string>>;

function planItemFieldErrors(form: RpzFormData): PlanItemFieldErrors {
  const errors: PlanItemFieldErrors = {};
  if (!form.initiatorDepartment.trim()) {
    errors.initiatorDepartment = 'Вкажіть підрозділ-ініціатор.';
  }
  if (!form.headFullName.trim()) {
    errors.headFullName = 'Вкажіть ПІБ керівника підрозділу.';
  }
  if (!form.executorFullName.trim()) {
    errors.executorFullName = 'Вкажіть ПІБ виконавця від ініціатора.';
  }
  if (!form.responsibleBuyer.trim()) {
    errors.responsibleBuyer = 'Оберіть відповідального закупника.';
  }
  if (!form.status) {
    errors.status = 'Оберіть статус.';
  }
  if (!form.subject.trim()) {
    errors.subject = 'Вкажіть предмет закупівлі.';
  }
  if (!form.needType) {
    errors.needType = 'Оберіть потребу.';
  }
  if (!form.procurementType.trim()) {
    errors.procurementType = 'Оберіть вид закупівлі.';
  }
  if (!form.category.trim()) {
    errors.category = 'Оберіть категорію.';
  }
  if (!form.fundingSource.trim()) {
    errors.fundingSource = 'Оберіть джерело фінансування.';
  }
  if (!form.ipInkrekpItem.trim()) {
    errors.ipInkrekpItem = 'Оберіть пункт ІП.';
  }
  if (parseCostThousands(form.expectedCost) === null) {
    errors.expectedCost = 'Вкажіть коректну очікувану вартість.';
  }
  return errors;
}

function focusFirstFieldError(errors: PlanItemFieldErrors) {
  const field = FIELD_ERROR_ORDER.find((key) => errors[key]);
  if (!field) {
    return;
  }
  document.getElementById(`rpz-${field}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  const location = useLocation();
  const listSearch = readRpzListSearch(location.state);
  const queryClient = useQueryClient();
  const { isAuthReady, isLoggedIn, user } = useAppContext();
  const isAdmin = useHasRole(ADMIN_ROLE);
  const canEdit = useCanEditProcurement();
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
  const buyersEnabled = directoriesEnabled && canEdit;
  const { data: buyers, isLoading: isBuyersQueryLoading } = useBuyers(buyersEnabled);
  const isBuyersLoading = buyersEnabled && isBuyersQueryLoading;
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
  const [fieldErrors, setFieldErrors] = useState<PlanItemFieldErrors>({});
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
      setFieldErrors({});
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
      setFieldErrors({});
      navigate(`${paths.rpz}/${created.id}`, { state: location.state });
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
      navigate({ pathname: paths.rpz, search: listSearch });
    },
  });
  const isDeleting = deleteItem.isPending;
  const readOnly = isCreate ? isCreating : mode !== 'edit' || isSaving;
  const isClosed = form.status === 'completed';
  const hasContract = (contractDocuments?.length ?? 0) > 0;
  const showPlannedDates = isCreate || (!isContractDocumentsLoading && !hasContract);
  const deleteError = deleteErrorMessage(deleteItem.error);

  function setField<K extends keyof RpzFormData>(key: K, value: RpzFormData[K]) {
    setFieldErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key as PlanItemErrorField];
      return next;
    });
    if (isCreate) {
      patchForm(setCreateForm, key, value);
      return;
    }
    setEditDraft((prev) =>
      prev && prev.id === id ? { id, form: { ...prev.form, [key]: value } } : prev,
    );
  }

  function startEdit() {
    if (!canEdit || !planItem || !id) {
      return;
    }
    setEditDraft({ id, form: toForm(planItem) });
    setSaveError('');
    setFieldErrors({});
  }

  function cancelEdit() {
    setEditDraft(null);
    setSaveError('');
    setFieldErrors({});
  }

  function rejectInvalid(formData: RpzFormData): boolean {
    setSaveError('');
    const errors = planItemFieldErrors(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) {
      return false;
    }
    focusFirstFieldError(errors);
    return true;
  }

  function saveEdit() {
    if (!draft || !id || !canEdit) {
      return;
    }
    if (rejectInvalid(draft)) {
      return;
    }
    saveChanges.mutate(toPlanItemUpdate(draft));
  }

  const buyerItems = useMemo(() => {
    const options = (buyers ?? []).map((buyer) => ({
      value: buyer.fullName,
      label: buyer.fullName,
    }));
    if (form.responsibleBuyer && !options.some((item) => item.value === form.responsibleBuyer)) {
      options.unshift({ value: form.responsibleBuyer, label: form.responsibleBuyer });
    }
    return options;
  }, [buyers, form.responsibleBuyer]);

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
    if (!canEdit) {
      return;
    }
    if (rejectInvalid(form)) {
      return;
    }
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
            to={{ pathname: paths.rpz, search: listSearch }}
            className="inline-block text-sm font-medium text-[var(--color-brand-600)] hover:underline"
          >
            ← Назад до списку РПЗ
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {pageTitle}
          </h1>
          {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
        </div>
        {isCreate && canEdit ? (
          <div className="flex shrink-0">
            <Button text="Зберегти" disabled={isCreating} onClick={saveCreate} />
          </div>
        ) : null}
        {!isCreate && planItem && mode === 'view' ? (
          <div className="flex shrink-0 gap-2">
            {isAdmin ? (
              <Button
                text="Видалити"
                icon="trash"
                variant="danger"
                onClick={() => {
                  deleteItem.reset();
                  setDeleteOpen(true);
                }}
              />
            ) : null}
            {canEdit && isClosed && !isAdmin ? (
              <span className="group relative inline-flex">
                <Button
                  text="Редагувати"
                  icon="edit"
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
            ) : canEdit ? (
              <Button text="Редагувати" icon="edit" onClick={startEdit} />
            ) : null}
          </div>
        ) : null}
        {!isCreate && mode === 'edit' ? (
          <div className="flex shrink-0 gap-2">
            <Button text="Відмінити" variant="secondary" disabled={isSaving} onClick={cancelEdit} />
            <Button text="Зберегти" disabled={isSaving} onClick={saveEdit} />
          </div>
        ) : null}
      </div>

      {isCreate && !canEdit ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Створювати пункти річного плану можуть лише адміністратор і закупівельник.
        </p>
      ) : !isCreate && isLoading ? (
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
              id="rpz-initiatorDepartment"
              label="Підрозділ-ініціатор"
              placeholder="Оберіть підрозділ"
              isLoading={isDepartmentsLoading}
              disabled={readOnly}
              items={departmentItems}
              value={form.initiatorDepartment}
              error={fieldErrors.initiatorDepartment}
              onChange={(v) => setField('initiatorDepartment', v)}
            />
            <FormField
              id="rpz-headFullName"
              label="ПІБ керівника підрозділу"
              value={form.headFullName}
              disabled={readOnly}
              error={fieldErrors.headFullName}
              onChange={(v) => setField('headFullName', v)}
            />
            <FormField
              id="rpz-executorFullName"
              label="ПІБ виконавця від ініціатора"
              value={form.executorFullName}
              disabled={readOnly}
              error={fieldErrors.executorFullName}
              onChange={(v) => setField('executorFullName', v)}
            />
          </FormSectionCard>

          <FormSectionCard title="Виконання">
            <FormSelect
              id="rpz-responsibleBuyer"
              label="Відповідальний закупник"
              placeholder="Оберіть закупника"
              isLoading={isBuyersLoading}
              disabled={readOnly}
              items={buyerItems}
              value={form.responsibleBuyer}
              error={fieldErrors.responsibleBuyer}
              onChange={(v) => setField('responsibleBuyer', v)}
            />
            <FormSelect
              id="rpz-status"
              label="Статус"
              placeholder="Оберіть статус"
              isLoading={isStatusesLoading}
              disabled={readOnly}
              items={statusItems}
              value={form.status}
              error={fieldErrors.status}
              onChange={(v) => setField('status', v)}
            />
          </FormSectionCard>

          <FormSectionCard title="Закупівля">
            <FormField
              id="rpz-subject"
              label="Предмет закупівлі"
              value={form.subject}
              disabled={readOnly}
              error={fieldErrors.subject}
              onChange={(v) => setField('subject', v)}
            />
            <FormSelect
              id="rpz-needType"
              label="Потреба (щорічна / разова)"
              placeholder="Оберіть потребу"
              disabled={readOnly}
              items={NEED_TYPE_OPTIONS}
              value={form.needType}
              error={fieldErrors.needType}
              onChange={(v) => setField('needType', v)}
            />
            <FormSelect
              id="rpz-procurementType"
              label="Вид закупівлі"
              placeholder="Оберіть вид закупівлі"
              isLoading={isKindsLoading}
              disabled={readOnly}
              items={procurementKindItems}
              value={form.procurementType}
              error={fieldErrors.procurementType}
              onChange={(v) => setField('procurementType', v)}
            />
            <FormSelect
              id="rpz-category"
              label="Категорія"
              placeholder="Оберіть категорію"
              isLoading={isCategoriesLoading}
              disabled={readOnly}
              items={categoryItems}
              value={form.category}
              error={fieldErrors.category}
              onChange={(v) => setField('category', v)}
            />
            <FormSelect
              id="rpz-fundingSource"
              label="Джерело фінансування"
              placeholder="Оберіть джерело фінансування"
              isLoading={isFundingLoading}
              disabled={readOnly}
              items={fundingSourceItems}
              value={form.fundingSource}
              error={fieldErrors.fundingSource}
              onChange={(v) => setField('fundingSource', v)}
            />
            <FormSelect
              id="rpz-ipInkrekpItem"
              label="Пункт ІП ІНКРЕКП"
              placeholder="Оберіть пункт ІП"
              isLoading={isIpLoading}
              disabled={readOnly}
              items={ipNkrekpItemOptions}
              value={form.ipInkrekpItem}
              error={fieldErrors.ipInkrekpItem}
              onChange={(v) => setField('ipInkrekpItem', v)}
            />
            <FormField
              label="Назва заходу"
              value={form.eventName}
              disabled={readOnly}
              onChange={(v) => setField('eventName', v)}
            />
            <FormField
              id="rpz-expectedCost"
              label="Очікувана вартість"
              value={form.expectedCost}
              disabled={readOnly}
              groupThousands
              suffix="тис. грн"
              error={fieldErrors.expectedCost}
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
                          state={{ rpzItemId: id, rpzListSearch: listSearch }}
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
              {!isCreate && canEdit && planItem && planItem.status !== 'completed' ? (
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
            ) : null}
            {showPlannedDates ? (
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
            ) : null}
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
