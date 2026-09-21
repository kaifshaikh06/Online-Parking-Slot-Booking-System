const StatusBadge = ({ status }) => <span className={`status-badge ${status === 'Available' || status === 'Cancelled' ? 'positive' : 'warning'}`}>{status}</span>;

export default StatusBadge;
