import { FeatureEditorDialog } from './FeatureEditorDialog'
import { FeatureListPanel } from './FeatureListPanel'
import { FeatureValueTable } from './FeatureValueTable'
import { useFeatureManagement } from '../model/useFeatureManagement'

export function FeatureManagement() {
  const management = useFeatureManagement()
  const {
    groups,
    types,
    values,
    pagination,
    selectedGroup,
    selectedType,
    selectedGroupId,
    selectedTypeId,
    page,
    isLoadingGroups,
    isLoadingTypes,
    isLoadingValues,
    globalError,
    editor,
    editorErrors,
    editorError,
    isSubmitting,
    selectGroup,
    selectType,
    setPage,
    openEditor,
    closeEditor,
    changeEditorField,
    submitEditor,
    deleteEditorItem,
    deleteValue,
  } = management

  return (
    <>
      <div
        aria-label="현재 선택 경로"
        className="mb-4 flex min-h-6 flex-wrap items-center gap-2 text-[13px] text-[var(--auth-muted)]"
      >
        {selectedGroup ? (
          <strong className="font-bold text-[var(--auth-primary-hover)]">
            {selectedGroup.feature}
          </strong>
        ) : (
          <span>대분류 미선택</span>
        )}
        <span className="text-[#b6bbc4]">›</span>
        {selectedType ? (
          <strong className="font-bold text-[var(--auth-primary-hover)]">
            {selectedType.feature}
          </strong>
        ) : (
          <span>중분류 미선택</span>
        )}
        <span className="text-[#b6bbc4]">›</span>
        <span>{pagination.totalItems}개 소분류</span>
      </div>

      {globalError && (
        <p
          className="mb-4 rounded-lg border border-[#f0d0cc] bg-[#fff8f7] px-4 py-3 text-sm text-[var(--auth-error)]"
          role="alert"
        >
          {globalError}
        </p>
      )}

      <div className="grid min-h-[636px] overflow-hidden rounded-xl border border-[var(--auth-border)] bg-[var(--auth-surface)] shadow-[0_2px_20px_rgb(32_39_52_/_7%)] lg:grid-cols-[270px_300px_minmax(0,1fr)]">
        <FeatureListPanel
          emptyText="등록된 대분류가 없습니다."
          footerText="대분류를 선택하면 중분류가 표시됩니다."
          isLoading={isLoadingGroups}
          items={groups}
          onAdd={() => openEditor('group', 'create')}
          onEdit={(group) => openEditor('group', 'edit', group)}
          onSelect={selectGroup}
          selectedId={selectedGroupId}
          title="대분류"
        />
        <FeatureListPanel
          addDisabled={!selectedGroup}
          emptyText={
            selectedGroup
              ? '등록된 중분류가 없습니다.'
              : '대분류를 선택해 주세요.'
          }
          footerText="중분류를 선택하면 소분류가 표시됩니다."
          isLoading={isLoadingTypes}
          items={types}
          onAdd={() => openEditor('type', 'create')}
          onEdit={(type) => openEditor('type', 'edit', type)}
          onSelect={selectType}
          selectedId={selectedTypeId}
          title="중분류"
        />
        <FeatureValueTable
          addDisabled={!selectedType}
          currentPage={page}
          isLoading={isLoadingValues}
          onAdd={() => openEditor('value', 'create')}
          onDelete={(value) => void deleteValue(value)}
          onEdit={(value) => openEditor('value', 'edit', value)}
          onPageChange={setPage}
          pagination={pagination}
          typeName={selectedType?.feature ?? null}
          values={values}
        />
      </div>

      {editor && (
        <FeatureEditorDialog
          editor={editor}
          error={editorError}
          errors={editorErrors}
          isSubmitting={isSubmitting}
          onClose={closeEditor}
          onDelete={deleteEditorItem}
          onFieldChange={changeEditorField}
          onSubmit={submitEditor}
        />
      )}
    </>
  )
}
