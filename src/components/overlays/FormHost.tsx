import { useApp } from '../../lib/app-context'
import { Modal } from '../ui'
import { DynamicForm } from '../DynamicForm'

export function FormHost() {
  const { ui, closeForm } = useApp()
  return (
    <Modal open={!!ui.form} onClose={closeForm} title={ui.form?.title || ''} subtitle={ui.form?.subtitle} size={ui.form?.size || 'md'}>
      {ui.form ? <DynamicForm config={ui.form} onCancel={closeForm} onSubmitDone={closeForm} /> : null}
    </Modal>
  )
}
