import { FeatureEditorDialog } from './FeatureEditorDialog'
import { FeatureHierarchyPanel } from './FeatureHierarchyPanel'
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
        className="mb-4 flex min-h-6 flex-wrap items-center gap-2 text-label text-ink-muted"
      >
        {selectedGroup ? (
          <strong className="font-bold text-brand-strong">
            {selectedGroup.feature}
          </strong>
        ) : (
          <span>대분류 미선택</span>
        )}
        <span className="text-ink-disabled">›</span>
        {selectedType ? (
          <strong className="font-bold text-brand-strong">
            {selectedType.feature}
          </strong>
        ) : (
          <span>중분류 미선택</span>
        )}
        <span className="text-ink-disabled">›</span>
        <span>{pagination.totalItems}개 소분류</span>
      </div>

      {globalError && (
        <p
          className="mb-4 rounded-control border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {globalError}
        </p>
      )}

      <div className="grid min-h-[636px] overflow-hidden rounded-panel border border-line bg-surface shadow-panel lg:grid-cols-[300px_minmax(0,1fr)]">
        <FeatureHierarchyPanel
          groups={groups}
          isLoadingGroups={isLoadingGroups}
          isLoadingTypes={isLoadingTypes}
          onAddGroup={() => openEditor('group', 'create')}
          onAddType={() => openEditor('type', 'create')}
          onEditGroup={(group) => openEditor('group', 'edit', group)}
          onEditType={(type) => openEditor('type', 'edit', type)}
          onSelectGroup={selectGroup}
          onSelectType={selectType}
          selectedGroup={selectedGroup}
          selectedGroupId={selectedGroupId}
          selectedType={selectedType}
          selectedTypeId={selectedTypeId}
          types={types}
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
