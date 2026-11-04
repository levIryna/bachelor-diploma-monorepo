import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useContractors } from '../../api/contractors';
import { useContractTypes, useProcurementProcedures } from '../../api/procurementDirectories';
import { useDepartmentDirectory } from '../../api/departments';
import {
  createContractDocument,
  deleteContractDocument,
  invalidateContractDocumentQueries,
  updateContractDocument,
  useContractDocument,
  type ContractDocumentCreate,
  type ContractDocumentDetail,
  type ContractDocumentUpdate,
} from '../../api/contractDocuments';
import { useProcurementPlanItem } from '../../api/procurementPlanItems';
import { ApiError } from '../../api/client';
import {
  Button,
  ConfirmDialog,
  FormField,
  FormSectionCard,
  FormSelect,
  Loader,
} from '../../components';
import { useAppContext } from '../../context/app-context';
import { useHasRole } from '../../hooks/useUserAccess';
import { ADMIN_ROLE } from '../../mocks/roles';
import { paths } from '../../routes/paths';
import { createEmptyDdForm, type DdFormData } from '../../types/ddForm';

function patchForm<K extends keyof DdFormData>(
  setter: Dispatch<SetStateAction<DdFormData>>,
  key: K,
  value: DdFormData[K],
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

function formatAmount(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(uah).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} грн`;
}

function parseOptionalThousands(value: string): { ok: true; value: number | null } | { ok: false } {
  const cleaned = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!cleaned) {
    return { ok: true, value: null };
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false };
  }
  return { ok: true, value: parsed };
}

function parseOptionalAmountThousands(
  value: string,
): { ok: true; value: number | null } | { ok: false } {
  const cleaned = value.trim().replace(/грн/gi, '').replace(/\s/g, '').replace(',', '.');
  if (!cleaned) {
    return { ok: true, value: null };
  }
  const uah = Number(cleaned);
  if (!Number.isFinite(uah) || uah < 0) {
    return { ok: false };
  }
  return { ok: true, value: Math.round(uah) / 1000 };
}

function formatThousands(value: number): string {
  return String(value);
}

function toForm(item: ContractDocumentDetail): DdFormData {
  return {
    year: String(item.year),
    number: item.seqNumber === null ? '' : String(item.seqNumber),
    rpzYearItem: `${item.year} · пункт ${item.lineNumber}`,
    subject: item.subject,
    itemType: '',
    expectedCostThousands:
      item.expectedCostThousands === null ? '' : formatThousands(item.expectedCostThousands),
    procedure: item.procedure,
    initiatorDepartment: item.department,
    tzResponsibleName: item.tzResponsibleName,
    technicalExpertName: item.technicalExpertName,
    estimatorName: item.estimatorName,
    buyerName: item.buyerName,
    actualApplicationDate: item.actualApplicationDate,
    procedureNumber: item.procedureNumber,
    etmUrl: item.etmUrl,
    contractor: item.contractor,
    contractSubject: item.contractSubject,
    contractAmount:
      item.contractAmountThousands === null ? '' : formatAmount(item.contractAmountThousands),
    contractDate: item.contractDate,
    contractType: item.contractType,
    validFrom: item.validFrom,
    validTo: item.validTo,
    notes: item.notes,
    amendments: item.amendments.map((entry) => `${entry.date} — ${entry.description}`).join('; '),
  };
}

function toUpdate(
  form: DdFormData,
  complete = false,
): { ok: true; value: ContractDocumentUpdate } | { ok: false; message: string } {
  if (!form.subject.trim()) {
    return { ok: false, message: 'Вкажіть предмет закупівлі.' };
  }
  if (complete && !form.itemType) {
    return { ok: false, message: 'Оберіть тип предмета.' };
  }
  if (!form.procedure.trim()) {
    return { ok: false, message: 'Оберіть вид процедури.' };
  }
  if (!form.initiatorDepartment.trim()) {
    return { ok: false, message: 'Оберіть підрозділ ініціатора.' };
  }
  if (complete && !form.tzResponsibleName.trim()) {
    return { ok: false, message: 'Вкажіть ПІБ відповідального за ТЗ.' };
  }
  if (complete && !form.technicalExpertName.trim()) {
    return { ok: false, message: 'Вкажіть ПІБ технічного експерта.' };
  }
  if (complete && !form.estimatorName.trim()) {
    return { ok: false, message: 'Вкажіть ПІБ кошторисника.' };
  }
  if (complete && !form.buyerName.trim()) {
    return { ok: false, message: 'Вкажіть ПІБ закупника.' };
  }
  if (complete && !form.actualApplicationDate) {
    return { ok: false, message: 'Вкажіть фактичний термін надання заявки.' };
  }
  if (complete && !form.procedureNumber.trim()) {
    return { ok: false, message: 'Вкажіть номер процедури.' };
  }
  if (complete && !form.etmUrl.trim()) {
    return { ok: false, message: 'Вкажіть посилання ЕТМ.' };
  }
  if (complete && !form.contractor.trim()) {
    return { ok: false, message: 'Оберіть контрагента.' };
  }
  if (complete && !form.contractSubject.trim()) {
    return { ok: false, message: 'Вкажіть предмет договору.' };
  }
  if (complete && !form.contractDate) {
    return { ok: false, message: 'Вкажіть дату укладання.' };
  }
  if (complete && !form.contractType.trim()) {
    return { ok: false, message: 'Оберіть тип договору.' };
  }
  if (complete && !form.validFrom) {
    return { ok: false, message: 'Вкажіть початок дії.' };
  }
  if (complete && !form.validTo) {
    return { ok: false, message: 'Вкажіть кінець дії.' };
  }
  if (complete && !form.notes.trim()) {
    return { ok: false, message: 'Вкажіть примітки.' };
  }

  const expectedCost = parseOptionalThousands(form.expectedCostThousands);
  if (!expectedCost.ok || (complete && expectedCost.value === null)) {
    return { ok: false, message: 'Вкажіть коректну очікувану вартість.' };
  }
  const amount = parseOptionalAmountThousands(form.contractAmount);
  if (!amount.ok || (complete && amount.value === null)) {
    return { ok: false, message: 'Вкажіть коректну суму договору.' };
  }
  if (form.validFrom && form.validTo && form.validFrom > form.validTo) {
    return { ok: false, message: 'Початок дії не може бути пізніше за кінець.' };
  }

  return {
    ok: true,
    value: {
      subject: form.subject.trim(),
      expectedCostThousands: expectedCost.value,
      procedure: form.procedure.trim(),
      department: form.initiatorDepartment.trim(),
      tzResponsibleName: form.tzResponsibleName.trim(),
      technicalExpertName: form.technicalExpertName.trim(),
      estimatorName: form.estimatorName.trim(),
      buyerName: form.buyerName.trim(),
      actualApplicationDate: form.actualApplicationDate,
      procedureNumber: form.procedureNumber.trim(),
      etmUrl: form.etmUrl.trim(),
      contractor: form.contractor.trim(),
      contractSubject: form.contractSubject.trim(),
      contractAmountThousands: amount.value,
      contractDate: form.contractDate,
      contractType: form.contractType.trim(),
      validFrom: form.validFrom,
      validTo: form.validTo,
      notes: form.notes.trim(),
    },
  };
}

const ITEM_TYPE_OPTIONS = [
  { value: 'goods', label: 'Товар' },
  { value: 'service', label: 'Послуга' },
  { value: 'work', label: 'Робота' },
] as const;

const PLAN_ITEM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function withCurrentOption(names: readonly string[] | undefined, current: string) {
  const options = (names ?? []).map((name) => ({ value: name, label: name }));
  if (current && !options.some((item) => item.value === current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
}

export function DdItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthReady, isLoggedIn, user } = useAppContext();
  const isAdmin = useHasRole(ADMIN_ROLE);
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreate = id === 'new';
  const planItemId = searchParams.get('planItemId') ?? '';
  const hasPlanItemId = PLAN_ITEM_ID_PATTERN.test(planItemId);
  const detailEnabled = !isCreate && isAuthReady && isLoggedIn;
  const planItemEnabled = isCreate && isAuthReady && isLoggedIn && hasPlanItemId;
  const {
    data: planItem,
    isLoading: isPlanItemLoading,
    isError: isPlanItemError,
  } = useProcurementPlanItem(planItemId, planItemEnabled);
  const { data: document, isLoading, isError } = useContractDocument(id ?? '', detailEnabled);
  const directoriesEnabled = isAuthReady && isLoggedIn;
  const { data: departmentDirectory, isLoading: isDepartmentsQueryLoading } =
    useDepartmentDirectory(directoriesEnabled, user?.id);
  const { data: procedures, isLoading: isProceduresQueryLoading } =
    useProcurementProcedures(directoriesEnabled);
  const { data: contractTypes, isLoading: isContractTypesQueryLoading } =
    useContractTypes(directoriesEnabled);
  const { data: contractors, isLoading: isContractorsQueryLoading } =
    useContractors(directoriesEnabled);
  const isDepartmentsLoading = !directoriesEnabled || isDepartmentsQueryLoading;
  const isProceduresLoading = !directoriesEnabled || isProceduresQueryLoading;
  const isContractTypesLoading = !directoriesEnabled || isContractTypesQueryLoading;
  const isContractorsLoading = !directoriesEnabled || isContractorsQueryLoading;
  const [createForm, setCreateForm] = useState<DdFormData>(createEmptyDdForm);
  const [editDraft, setEditDraft] = useState<{ id: string; form: DdFormData } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const draft = editDraft && editDraft.id === id ? editDraft.form : null;
  const mode = draft ? 'edit' : 'view';
  const viewForm = document ? toForm(document) : createEmptyDdForm();
  const form = isCreate ? createForm : (draft ?? viewForm);

  const createDocument = useMutation({
    mutationFn: (body: ContractDocumentCreate) => createContractDocument(body),
    onSuccess: async () => {
      await invalidateContractDocumentQueries(queryClient, planItemId);
      setSaveError('');
      navigate(`${paths.rpz}/${planItemId}`);
    },
    onError: (error: unknown) => {
      setSaveError(error instanceof ApiError ? error.message : 'Не вдалося зберегти договір.');
    },
  });
  const isCreating = createDocument.isPending;
  const saveChanges = useMutation({
    mutationFn: (body: ContractDocumentUpdate) => updateContractDocument(id ?? '', body),
    onSuccess: async () => {
      await invalidateContractDocumentQueries(queryClient, id ?? '');
      setEditDraft(null);
      setSaveError('');
    },
    onError: (error: unknown) => {
      setSaveError(error instanceof ApiError ? error.message : 'Не вдалося зберегти зміни.');
    },
  });
  const isSaving = saveChanges.isPending;
  const deleteDocument = useMutation({
    mutationFn: () => deleteContractDocument(id ?? ''),
    onSuccess: () => {
      setDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['contract_documents'] });
      void queryClient.invalidateQueries({ queryKey: ['plan_item_contract_documents'] });
      void queryClient.invalidateQueries({ queryKey: ['kpi_cards'] });
      void queryClient.invalidateQueries({ queryKey: ['procurement_dynamics'] });
      navigate(paths.procurements);
    },
  });
  const isDeleting = deleteDocument.isPending;
  const readOnly = isCreate ? isCreating : mode !== 'edit' || isSaving;
  const canCreate =
    isCreate && hasPlanItemId && planItem !== undefined && planItem.status !== 'completed';
  const rpzYearItem =
    isCreate && planItem ? `${planItem.year} · пункт ${planItem.lineNumber}` : form.rpzYearItem;

  function setField<K extends keyof DdFormData>(key: K, value: DdFormData[K]) {
    if (isCreate) {
      patchForm(setCreateForm, key, value);
      return;
    }
    setEditDraft((prev) =>
      prev && prev.id === id ? { id, form: { ...prev.form, [key]: value } } : prev,
    );
  }

  function startEdit() {
    if (!document || !id) {
      return;
    }
    setEditDraft({ id, form: toForm(document) });
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
    const parsed = toUpdate(draft);
    if (!parsed.ok) {
      setSaveError(parsed.message);
      return;
    }
    setSaveError('');
    saveChanges.mutate(parsed.value);
  }

  function saveCreate() {
    if (!canCreate || !planItem) {
      return;
    }
    const parsed = toUpdate(form, true);
    if (!parsed.ok) {
      setSaveError(parsed.message);
      return;
    }
    setSaveError('');
    createDocument.mutate({
      ...parsed.value,
      planItemId,
      itemType: form.itemType,
    });
  }

  const departmentItems = useMemo(
    () =>
      withCurrentOption(
        (departmentDirectory ?? []).map((department) => department.name),
        form.initiatorDepartment,
      ),
    [departmentDirectory, form.initiatorDepartment],
  );
  const procedureItems = useMemo(
    () => withCurrentOption(procedures, form.procedure),
    [form.procedure, procedures],
  );
  const contractTypeItems = useMemo(
    () => withCurrentOption(contractTypes, form.contractType),
    [contractTypes, form.contractType],
  );
  const contractorItems = useMemo(
    () => withCurrentOption(contractors, form.contractor),
    [contractors, form.contractor],
  );

  const pageTitle = useMemo(() => {
    if (isCreate) {
      return 'Новий ДД';
    }
    if (form.year && form.number) {
      return `${form.year} · ${form.number}`;
    }
    return 'Договірна документація';
  }, [form.number, form.year, isCreate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {isCreate ? null : (
            <Link
              to={paths.procurements}
              className="inline-block text-sm font-medium text-[var(--color-brand-600)] hover:underline"
            >
              ← Назад до списку ДД
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {pageTitle}
          </h1>
          {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
        </div>
        {canCreate ? (
          <div className="flex shrink-0 gap-2">
            <Button
              text="Скасувати"
              variant="secondary"
              disabled={isCreating}
              onClick={() => navigate(`${paths.rpz}/${planItemId}`)}
            />
            <Button text="Зберегти" disabled={isCreating} onClick={saveCreate} />
          </div>
        ) : null}
        {!isCreate && document && mode === 'view' ? (
          <div className="flex shrink-0 gap-2">
            {isAdmin ? (
              <Button
                text="Видалити"
                variant="danger"
                onClick={() => {
                  deleteDocument.reset();
                  setDeleteOpen(true);
                }}
              />
            ) : null}
            <Button text="Редагувати" onClick={startEdit} />
          </div>
        ) : null}
        {!isCreate && mode === 'edit' ? (
          <div className="flex shrink-0 gap-2">
            <Button text="Скасувати" variant="secondary" disabled={isSaving} onClick={cancelEdit} />
            <Button text="Зберегти" disabled={isSaving} onClick={saveEdit} />
          </div>
        ) : null}
      </div>

      {isCreate && !hasPlanItemId ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Договір можна створити лише з пункту річного плану.
        </p>
      ) : isCreate && (!planItemEnabled || isPlanItemLoading) ? (
        <div className="flex justify-center py-16">
          <Loader size={28} />
        </div>
      ) : isCreate && (isPlanItemError || !planItem) ? (
        <p className="text-sm text-[var(--color-text-muted)]">Не вдалося завантажити пункт РПЗ.</p>
      ) : isCreate && planItem?.status === 'completed' ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          До завершеної закупівлі не можна додати договір.
        </p>
      ) : !isCreate && (!detailEnabled || isLoading) ? (
        <div className="flex justify-center py-16">
          <Loader size={28} />
        </div>
      ) : !isCreate && (isError || !document) ? (
        <p className="text-sm text-[var(--color-text-muted)]">Не вдалося завантажити договір.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <FormSectionCard title="Зв’язок з РПЗ">
            <FormField
              label="Номер договору"
              value={isCreate ? 'Присвоюється автоматично' : form.number}
              disabled
              onChange={() => undefined}
            />
            {isCreate ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Номер договору присвоюється автоматично під час збереження.
              </p>
            ) : null}
            <FormField
              label="РПЗ: рік + пункт"
              value={rpzYearItem}
              disabled
              onChange={() => undefined}
            />
            <FormField
              label="Предмет закупівлі"
              value={form.subject}
              disabled={readOnly}
              onChange={(value) => setField('subject', value)}
            />
            {isCreate ? (
              <FormSelect
                label="Тип предмета"
                placeholder="Оберіть тип предмета"
                disabled={readOnly}
                items={ITEM_TYPE_OPTIONS}
                value={form.itemType}
                onChange={(value) => setField('itemType', value)}
              />
            ) : null}
          </FormSectionCard>

          <FormSectionCard title="Заявка і процедура">
            <FormField
              label="Очікувана вартість за заявкою, тис. грн"
              value={form.expectedCostThousands}
              disabled={readOnly}
              onChange={(value) => setField('expectedCostThousands', value)}
            />
            <FormSelect
              label="Вид процедури"
              placeholder="Оберіть процедуру"
              isLoading={isProceduresLoading}
              disabled={readOnly}
              items={procedureItems}
              value={form.procedure}
              onChange={(value) => setField('procedure', value)}
            />
            <FormSelect
              label="Підрозділ ініціатора"
              placeholder="Оберіть підрозділ"
              isLoading={isDepartmentsLoading}
              disabled={readOnly}
              items={departmentItems}
              value={form.initiatorDepartment}
              onChange={(value) => setField('initiatorDepartment', value)}
            />
            <FormField
              label="ПІБ відповідального за ТЗ"
              value={form.tzResponsibleName}
              disabled={readOnly}
              onChange={(value) => setField('tzResponsibleName', value)}
            />
            <FormField
              label="ПІБ технічного експерта"
              value={form.technicalExpertName}
              disabled={readOnly}
              onChange={(value) => setField('technicalExpertName', value)}
            />
            <FormField
              label="ПІБ кошторисника"
              value={form.estimatorName}
              disabled={readOnly}
              onChange={(value) => setField('estimatorName', value)}
            />
            <FormField
              label="ПІБ закупника"
              value={form.buyerName}
              disabled={readOnly}
              onChange={(value) => setField('buyerName', value)}
            />
            <FormField
              label="Фактичний термін надання заявки"
              type="date"
              value={form.actualApplicationDate}
              disabled={readOnly}
              onChange={(value) => setField('actualApplicationDate', value)}
            />
            <FormField
              label="Номер процедури"
              value={form.procedureNumber}
              disabled={readOnly}
              onChange={(value) => setField('procedureNumber', value)}
            />
            <FormField
              label="Посилання ЕТМ"
              value={form.etmUrl}
              disabled={readOnly}
              onChange={(value) => setField('etmUrl', value)}
            />
          </FormSectionCard>

          <FormSectionCard title="Договір">
            <FormSelect
              label="Контрагент"
              placeholder="Оберіть контрагента"
              isLoading={isContractorsLoading}
              disabled={readOnly}
              items={contractorItems}
              value={form.contractor}
              onChange={(value) => setField('contractor', value)}
            />
            <FormField
              label="Предмет договору"
              value={form.contractSubject}
              disabled={readOnly}
              onChange={(value) => setField('contractSubject', value)}
            />
            <FormField
              label="Сума договору, грн без ПДВ"
              value={form.contractAmount}
              disabled={readOnly}
              onChange={(value) => setField('contractAmount', value)}
            />
            <FormField
              label="Дата укладання"
              type="date"
              value={form.contractDate}
              disabled={readOnly}
              onChange={(value) => setField('contractDate', value)}
            />
            <FormSelect
              label="Тип договору"
              placeholder="Оберіть тип договору"
              isLoading={isContractTypesLoading}
              disabled={readOnly}
              items={contractTypeItems}
              value={form.contractType}
              onChange={(value) => setField('contractType', value)}
            />
            <FormField
              label="Початок дії"
              type="date"
              value={form.validFrom}
              disabled={readOnly}
              onChange={(value) => setField('validFrom', value)}
            />
            <FormField
              label="Кінець дії"
              type="date"
              value={form.validTo}
              disabled={readOnly}
              onChange={(value) => setField('validTo', value)}
            />
            <FormField
              label="Примітки"
              value={form.notes}
              disabled={readOnly}
              onChange={(value) => setField('notes', value)}
            />
            {isCreate ? null : (
              <FormField
                label="Зміни до ДД"
                value={form.amendments}
                disabled
                onChange={() => undefined}
              />
            )}
          </FormSectionCard>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Видалити договір"
        message={`Видалити договір ${pageTitle}?`}
        confirmText="Видалити"
        pending={isDeleting}
        error={
          deleteDocument.error instanceof ApiError
            ? deleteDocument.error.message
            : deleteDocument.error
              ? 'Не вдалося видалити договір.'
              : ''
        }
        onConfirm={() => deleteDocument.mutate()}
        onClose={() => {
          if (!isDeleting) {
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}
