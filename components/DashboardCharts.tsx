import React from 'react';
import { WeatherData, TrafficData, WeatherDay } from '../types';

const AnimatedSun: React.FC = () => (
    <g>
        <circle cx="0" cy="0" r="5" className="fill-secondary" />
        <g className="sun-rays" style={{ transformOrigin: 'center' }}>
            {[...Array(8)].map((_, i) => (
                <line key={i} x1="0" y1="-9" x2="0" y2="-6" className="stroke-secondary" strokeWidth="1" strokeLinecap="round" transform={`rotate(${i * 45})`} />
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
// FIX: Combined two `className` attributes into a single attribute to resolve the JSX error.
            <line key={i} x1={-5 + i * 5} y1="5" x2={-5 + i * 5} y2="10" className="stroke-primary rain-drop" strokeWidth="1" strokeLinecap="round" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
    </g>
);

const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear') || lowerCondition.includes('صحو') || lowerCondition.includes('شمس')) return <AnimatedSun />;
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower') || lowerCondition.includes('مطر')) return <AnimatedRain />;
    if (lowerCondition.includes('cloud') || lowerCondition.includes('غائم')) return <AnimatedCloud />;
    return <tspan>🌍</tspan>;
};

const ForecastDayColumn: React.FC<{day: WeatherDay}> = ({ day }) => (
    <div className="flex flex-col items-center space-y-1">
        <div className="w-8 h-8">
            <svg viewBox="-15 -15 30 30">{getWeatherIcon(day.condition)}</svg>
        </div>
        <span className="text-sm font-bold">{day.high}</span>
        <div className="w-1 h-10 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
        <span className="text-sm font-bold opacity-70">{day.low}</span>
        <span className="text-xs opacity-60">{day.day}</span>
    </div>
);


interface WeatherChartProps {
    weather: WeatherData;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({ weather }) => {
    const { forecast, current } = weather;

    return (
        <div className="w-full h-full flex items-center justify-between p-2 text-base-content-dark">
            <div className="text-left shrink-0 pr-4">
                <p className="text-4xl font-bold">{current.temperature}</p>
                <p className="text-lg opacity-80">{current.condition}</p>
                <p className="text-xs opacity-60">{current.location}</p>
            </div>
            <div className="flex-1 flex justify-around text-center">
                {forecast.map((day) => (
                    <ForecastDayColumn key={day.day} day={day} />
                ))}
            </div>
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
                            <text x="0" y={y + 8} fontSize="7" fill="currentColor" fillOpacity="0.8" textLength="85" lengthAdjust="spacingAndGlyphs">{road.roadName}</text>
                            <rect 
                                x="90" 
                                y={y} 
                                width="100" 
                                height="12" 
                                rx="3" 
                                fill={getStatusColor(road.status)} 
                            />
                            <text x="140" y={y + 8.5} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">{road.status}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
