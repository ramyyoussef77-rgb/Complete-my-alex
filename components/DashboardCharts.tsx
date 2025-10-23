import React from 'react';
import { WeatherData, TrafficData } from '../types';

const AnimatedSun: React.FC = () => (
    <g>
        <circle cx="0" cy="0" r="5" fill="#FFD740" />
        <g className="sun-rays" style={{ transformOrigin: 'center' }}>
            {[...Array(8)].map((_, i) => (
                <line key={i} x1="0" y1="-9" x2="0" y2="-6" stroke="#FFD740" strokeWidth="1" strokeLinecap="round" transform={`rotate(${i * 45})`} />
            ))}
        </g>
    </g>
);

const AnimatedCloud: React.FC = () => (
    <g className="cloud-drift" style={{ transformOrigin: 'center' }}>
        <path d="M-10 0 Q-15 -8 0 -8 Q15 -8 10 0 Z" fill="#E0E0E0" />
        <path d="M-15 5 Q-20 0 -5 0 Q10 0 5 5 Z" fill="#F5F5F5" />
    </g>
);

const AnimatedRain: React.FC = () => (
    <g>
        <AnimatedCloud />
        {[...Array(3)].map((_, i) => (
            <line key={i} x1={-5 + i * 5} y1="5" x2={-5 + i * 5} y2="10" stroke="#4FC3F7" strokeWidth="1" strokeLinecap="round" className="rain-drop" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
    </g>
);

interface WeatherChartProps {
    weather: WeatherData;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({ weather }) => {
    const { forecast, current } = weather;
    const temps = forecast.flatMap(d => [parseInt(d.high), parseInt(d.low)]);
    const minTemp = Math.min(...temps) - 2;
    const maxTemp = Math.max(...temps) + 2;
    const tempRange = maxTemp - minTemp;
    
    const getPoint = (temp: number, index: number) => {
        const x = 25 + index * 25;
        const y = 80 - ((temp - minTemp) / tempRange) * 70;
        return { x, y };
    };

    const highPoints = forecast.map((d, i) => getPoint(parseInt(d.high), i));
    const lowPoints = forecast.map((d, i) => getPoint(parseInt(d.low), i));

    const highPath = highPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const lowPath = lowPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    const getWeatherIcon = (condition: string) => {
        const lowerCondition = condition.toLowerCase();
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear') || lowerCondition.includes('صحو') || lowerCondition.includes('شمس')) return <AnimatedSun />;
        if (lowerCondition.includes('rain') || lowerCondition.includes('shower') || lowerCondition.includes('مطر')) return <AnimatedRain />;
        if (lowerCondition.includes('cloud') || lowerCondition.includes('غائم')) return <AnimatedCloud />;
        return <tspan>🌍</tspan>;
    };

    return (
        <div className="w-full flex items-center justify-between p-2 text-base-content-dark">
            <div className="text-left shrink-0 pr-4">
                <p className="text-5xl font-bold">{current.temperature}</p>
                <p className="text-lg opacity-80">{current.condition}</p>
                <p className="text-xs opacity-60">{current.location}</p>
            </div>
            <svg viewBox="0 0 100 100" className="w-full h-auto">
                <path d={highPath} fill="none" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" />
                <path d={lowPath} fill="none" stroke="#4FC3F7" strokeWidth="2" strokeLinecap="round" />

                {forecast.map((day, i) => (
                    <g key={i}>
                        {/* High temp point and label */}
                        <circle cx={highPoints[i].x} cy={highPoints[i].y} r="2.5" fill="#FFB74D" />
                        <text x={highPoints[i].x} y={highPoints[i].y - 6} textAnchor="middle" fill="#FFB74D" fontSize="8" fontWeight="bold">{day.high}</text>

                        {/* Low temp point and label */}
                        <circle cx={lowPoints[i].x} cy={lowPoints[i].y} r="2.5" fill="#4FC3F7" />
                        <text x={lowPoints[i].x} y={lowPoints[i].y + 12} textAnchor="middle" fill="#4FC3F7" fontSize="8" fontWeight="bold">{day.low}</text>
                        
                        {/* Day label and icon */}
                        <text x={highPoints[i].x} y="95" textAnchor="middle" fillOpacity="0.8" fontSize="8">{day.day}</text>
                        <g transform={`translate(${highPoints[i].x}, 12) scale(1.2)`}>
                            {getWeatherIcon(day.condition)}
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    );
};

interface TrafficChartProps {
    traffic: TrafficData;
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ traffic }) => {
    const getStatusColor = (status: string) => {
        if (!status) return '#9CA3AF'; // Gray
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('heavy') || lowerStatus.includes('ثقيل') || lowerStatus.includes('مزدحم')) return '#E53935'; // Red
        if (lowerStatus.includes('moderate') || lowerStatus.includes('متوسط')) return '#FFB300'; // Amber
        if (lowerStatus.includes('light') || lowerStatus.includes('خفيف')) return '#43A047'; // Green
        return '#9CA3AF';
    };

    return (
        <div className="w-full h-full p-2">
            <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                {traffic.roads.map((road, index) => {
                    const y = 5 + index * 19;
                    return (
                        <g key={index}>
                            <text x="0" y={y + 8} fontSize="8" fill="currentColor" fillOpacity="0.8" className="truncate">{road.roadName}</text>
                            <rect 
                                x="90" 
                                y={y} 
                                width="100" 
                                height="12" 
                                rx="3" 
                                fill={getStatusColor(road.status)} 
                            />
                            <text x="140" y={y + 8.5} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{road.status}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};