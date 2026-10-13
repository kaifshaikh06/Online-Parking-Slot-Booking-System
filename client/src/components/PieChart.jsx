const colors = ["#155eef", "#f4a340", "#18a566", "#8b5cf6", "#db4456", "#16a2b8"];

const PieChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = data.length
    ? data
        .map((item, index) => {
          const start = cursor;
          cursor += (item.value / total) * 100;
          return `${colors[index % colors.length]} ${start}% ${cursor}%`;
        })
        .join(", ")
    : "#dce3ee 0 100%";

  return (
    <section className="chart-card pie-chart-card">
      <div className="chart-heading">
        <h2>{title}</h2>
        <span>Total bookings</span>
      </div>
      {data.length ? (
        <div className="pie-chart-layout">
          <div
            className="pie-chart"
            style={{ background: `conic-gradient(${gradient})` }}
            role="img"
            aria-label={title}
          >
            <span>{total}</span>
          </div>
          <div className="pie-legend">
            {data.map((item, index) => (
              <div key={item.label}>
                <i style={{ background: colors[index % colors.length] }} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="chart-empty">No completed or active bookings yet.</p>
      )}
    </section>
  );
};

export default PieChart;
