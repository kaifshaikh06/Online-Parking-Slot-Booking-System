const BarChart = ({ data, title, valueLabel = "Amount" }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="chart-card">
      <div className="chart-heading">
        <h2>{title}</h2>
        <span>{valueLabel}</span>
      </div>
      <div className="bar-chart" aria-label={title}>
        {data.map((item) => (
          <div className="bar-chart-item" key={item.key || item.label}>
            <strong>₹{Math.round(item.value).toLocaleString()}</strong>
            <div className="bar-chart-track">
              <span
                style={{ height: `${Math.max((item.value / maxValue) * 100, 3)}%` }}
                title={`${item.label}: ₹${item.value.toLocaleString()}`}
              />
            </div>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BarChart;
