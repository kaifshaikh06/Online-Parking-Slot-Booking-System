const series = [
  { key: "parking", label: "Parking", color: "#155eef" },
  { key: "services", label: "Quick services", color: "#18a566" },
  { key: "overstay", label: "Overstay charges", color: "#f4a340" },
  { key: "total", label: "Total revenue", color: "#8b5cf6" },
];

const LineChart = ({ data, title }) => {
  const width = 680;
  const height = 250;
  const padding = { top: 24, right: 18, bottom: 34, left: 48 };
  const values = data.flatMap((item) => series.map(({ key }) => item[key]));
  const maxValue = Math.max(...values, 1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const pointFor = (item, index, key) => {
    const x =
      padding.left +
      (data.length > 1 ? (index / (data.length - 1)) * plotWidth : plotWidth / 2);
    const y = padding.top + plotHeight - (item[key] / maxValue) * plotHeight;
    return [x, y];
  };

  const makePath = (key) =>
    data
      .map((item, index) => {
        const [x, y] = pointFor(item, index, key);
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");

  return (
    <section className="chart-card line-chart-card">
      <div className="chart-heading">
        <h2>{title}</h2>
        <span>Last 6 months · ₹</span>
      </div>
      <div className="line-chart-legend">
        {series.map((line) => (
          <span key={line.key}>
            <i style={{ background: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
      <div className="line-chart-scroll">
        <svg
          className="line-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={title}
        >
          {[0, 0.5, 1].map((ratio) => {
            const y = padding.top + plotHeight - ratio * plotHeight;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  className="line-chart-grid"
                />
                <text x={padding.left - 8} y={y + 4} className="line-chart-axis">
                  ₹{Math.round(maxValue * ratio).toLocaleString()}
                </text>
              </g>
            );
          })}
          {series.map((line) => (
            <g key={line.key}>
              <path
                d={makePath(line.key)}
                fill="none"
                stroke={line.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((item, index) => {
                const [x, y] = pointFor(item, index, line.key);
                return (
                  <circle key={item.key} cx={x} cy={y} r="3.5" fill={line.color}>
                    <title>
                      {line.label}, {item.label}: ₹{item[line.key].toLocaleString()}
                    </title>
                  </circle>
                );
              })}
            </g>
          ))}
          {data.map((item, index) => {
            const [x] = pointFor(item, index, "total");
            return (
              <text
                key={item.key}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="line-chart-axis"
              >
                {item.label}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
};

export default LineChart;
