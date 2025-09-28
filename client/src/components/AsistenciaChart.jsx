import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useTheme } from '../context/ThemeContext.jsx'; // 1. Importar el hook del tema

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function AsistenciaChart() {
  const { theme } = useTheme(); // 2. Obtener el tema actual
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [error, setError] = useState('');

  // 3. Definir colores basados en el tema
  const a = 'rgba(32, 201, 151, '; // Color principal del gradiente (Teal)
  const b = 'rgba(59, 130, 246, '; // Color secundario del gradiente (Azul)
  const textColor = theme === 'dark' ? 'rgba(233, 236, 239, 0.8)' : 'rgba(33, 37, 41, 0.8)';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

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
              borderColor: a + '1)',
              // El fondo del gráfico ahora es un gradiente
              backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                if (!ctx) return null;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, a + '0.5)');
                gradient.addColorStop(1, b + '0.1)');
                return gradient;
              },
              fill: true,
              tension: 0.4,
              pointBackgroundColor: a + '1)',
              pointBorderColor: '#fff',
            },
          ],
        });
      } catch (err) {
        setError('No se pudieron cargar los datos del gráfico.');
      }
    };
    fetchChartData();
  }, [a, b]); // Dependencias para que se actualice si cambian los colores (aunque son constantes)

  // 4. Hacer que las opciones del gráfico dependan del tema
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Asistencia por Sesión en los Últimos 30 Días',
        color: textColor,
        font: { size: 18, family: 'Poppins' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor, stepSize: 1, font: { family: 'Poppins' } },
        grid: { color: gridColor }
      },
      x: {
        ticks: { color: textColor, font: { family: 'Poppins' } },
        grid: { color: 'transparent' } // Hacemos la rejilla X transparente
      },
    },
  };

  if (error) return <p className="message-error">{error}</p>;

  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <Line options={options} data={chartData} />
    </div>
  );
}

export default AsistenciaChart;