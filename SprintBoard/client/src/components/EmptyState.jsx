export default function EmptyState({ title, description, action, illustration }) {
  return (
    <div className="empty-state">
      {illustration ? (
        <img className="empty-state-art" src={illustration} alt="" />
      ) : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
