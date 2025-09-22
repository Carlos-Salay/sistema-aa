// client/src/components/AsistenciaChart.jsx
import React, { useState, useEffect } from 'react';
// 1. Importamos 'Line' en lugar de 'Bar'
import { Line } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// 2. Registramos los nuevos elementos para el gráfico de líneas
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function AsistenciaChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/stats/asistencia-mensual');
        const data = await response.json();
        
        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: 'Asistentes por Sesión',
              data: data.data,
              borderColor: 'rgba(0, 106, 78, 1)', // Verde sólido para la línea
              backgroundColor: 'rgba(0, 106, 78, 0.2)', // Verde con transparencia para el área bajo la línea
              fill: true, // Rellena el área bajo la línea
              tension: 0.4, // Hace la línea un poco curva y suave
            },
          ],
        });
      } catch (err) {
        setError('No se pudieron cargar los datos del gráfico.');
      }
    };
    fetchChartData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Ocultamos la leyenda, el título es suficiente
      title: {
        display: true,
        text: 'Asistencia por Sesión en los Últimos 30 Días',
        color: 'white',
        font: { size: 18 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'white', stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
    },
  };

  if (error) return <p className="message-error">{error}</p>;

  return (
    <div style={{ height: '400px', position: 'relative' }}>
      {/* 3. Usamos el componente <Line> */}
      <Line options={options} data={chartData} />
    </div>
  );
}

export default AsistenciaChart;