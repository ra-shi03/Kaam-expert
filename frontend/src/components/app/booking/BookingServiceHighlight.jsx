/** Selected trade / skill — prominent highlight on booking steps. */
export function BookingServiceHighlight({ categoryName, serviceName, kicker = 'Booking for' }) {
  if (!categoryName && !serviceName) return null

  return (
    <div className="lc-booking-highlight" role="status">
      <p className="lc-booking-highlight-kicker">{kicker}</p>
      {categoryName ? <p className="lc-booking-highlight-title">{categoryName}</p> : null}
      {serviceName ? <p className="lc-booking-highlight-sub">{serviceName}</p> : null}
    </div>
  )
}
