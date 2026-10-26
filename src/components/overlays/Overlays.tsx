import { useApp } from '../../lib/app-context'
import { FormHost } from './FormHost'
import { MemberDrawer } from './MemberDrawer'
import { ReceiptModal } from './ReceiptModal'
import { DigitalCardModal } from './DigitalCardModal'
import { CheckInModal } from './CheckInModal'
import { AiModal } from './AiModal'

export function Overlays() {
  const { ui } = useApp()
  return (
    <>
      {ui.form ? <FormHost /> : null}
      {ui.memberDetailId ? <MemberDrawer /> : null}
      {ui.receiptId ? <ReceiptModal /> : null}
      {ui.cardId ? <DigitalCardModal /> : null}
      {ui.checkInOpen ? <CheckInModal /> : null}
      {ui.aiType ? <AiModal /> : null}
    </>
  )
}
