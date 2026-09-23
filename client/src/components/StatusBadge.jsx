const StatusBadge = ({ status }) => <span className={`status-badge ${status === 'Ended' ? 'ended' : status === 'Available' || status === 'Cancelled' ? 'positive' : 'warning'}`}>{status}</span>;

export default StatusBadge;
