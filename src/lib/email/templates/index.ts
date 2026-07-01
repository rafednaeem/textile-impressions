export { baseLayout, sectionBox, ctaButton, statusBadge } from "./base-layout"

export {
  orderReceivedTemplate,
  orderPaymentPendingTemplate,
  orderPaymentProofReceivedTemplate,
  orderPaymentUnderVerificationTemplate,
  orderPaymentApprovedTemplate,
  orderPaymentRejectedTemplate,
  orderConfirmedTemplate,
  orderBeingPreparedTemplate,
  orderDispatchedTemplate,
  orderDeliveredTemplate,
  orderCodReceivedTemplate,
  orderCancelledTemplate,
  orderRefundProcessedTemplate,
  getOrderTemplate,
  getStatusLabel,
  getStatusColor,
} from "./order-templates"
export type { FullOrderData } from "./order-templates"

export {
  workshopRegistrationReceivedTemplate,
  workshopRegistrationConfirmedFreeTemplate,
  workshopPaymentRequiredTemplate,
  workshopPaymentProofReceivedTemplate,
  workshopPaymentUnderReviewTemplate,
  workshopPaymentApprovedTemplate,
  workshopPaymentRejectedTemplate,
  workshopSeatConfirmedTemplate,
  workshopReminderTemplate,
  workshopCompletedTemplate,
  workshopCancelledTemplate,
} from "./workshop-templates"

export {
  customOrderReceivedTemplate,
} from "./custom-order-templates"

export {
  incubatorEnquiryReceivedTemplate,
} from "./incubator-templates"
