import { patchAdminLabourCategory } from '../../api/adminLabourCategoriesApi.js'
import { AdminCategoryImageEditor } from './AdminCategoryImageEditor.jsx'

export function AdminSubcategoryImageEditor({ category, onUpdated }) {
  return (
    <AdminCategoryImageEditor
      label="Subcategory image"
      imageUrl={category.imageUrl}
      hint="Shown on homeowner home — Book by skill and search tiles."
      onSave={async (imageUrl) => {
        await patchAdminLabourCategory(category._id, { imageUrl })
        onUpdated?.()
      }}
    />
  )
}
