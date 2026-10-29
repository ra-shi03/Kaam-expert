import { AdminPolicyEditor } from '../../components/admin/AdminPolicyEditor.jsx'
import { CompanyInfoCard } from '../../components/admin/CompanyInfoCard.jsx'

export function AdminSupportPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <CompanyInfoCard />
      <AdminPolicyEditor
        type="support"
        title="Support Page"
        roles={['customer', 'labour']}
        description="Help questions and answers shown on the public Support page. Each heading becomes a question."
      />
    </div>
  )
}
