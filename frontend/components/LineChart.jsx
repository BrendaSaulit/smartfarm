import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registra os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ data, options = {} }) {
  // Configurações padrão do gráfico
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e0e0e0',
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: '#00ff00',
        bodyColor: '#e0e0e0',
        borderColor: '#00ff00',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(1);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a0a0a0',
          maxTicksLimit: 10
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a0a0a0',
          callback: function(value) {
            return value + '%';
          }
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hoverRadius: 6
      }
    },
    ...options
  };

  // Configurações de tema escuro para o gráfico
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      borderWidth: 2,
      fill: true,
      pointBackgroundColor: dataset.borderColor,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: dataset.borderColor
    }))
  };

  return <Line data={chartData} options={defaultOptions} />;
}