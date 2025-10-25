import React from 'react';
import { WeatherData, TrafficData, WeatherDay } from '../types';

interface IconComponentProps {
    scale?: number; // Optional, default to 1 if not provided
    colorClass?: string; // Optional, default to 'currentColor' if not provided
}

const WeatherIcon = {
    Sun: ({ scale = 1, colorClass = 'currentColor' }: IconComponentProps) => (
        <g transform={`scale(${scale})`}>
            <circle cx="0" cy="0" r="5" className={colorClass} />
            <g className="sun-rays" style={{ transformOrigin: 'center' }}>
                {[...Array(8)].map((_, i) => (
                    <line key={i} x1="0" y1="-9" x2="0" y2="-6" className={colorClass} strokeWidth="1" strokeLinecap="round" transform={`rotate(${i * 45})`} />
                ))}
            </g>
        </g>
    ),
    Cloud: ({ scale = 1, colorClass = 'currentColor' }: IconComponentProps) => (
        <g className="cloud-drift" transform={`scale(${scale})`}>
            <path d="M-10 0 Q-15 -8 0 -8 Q15 -8 10 0 Z" fill="currentColor" className={colorClass} />
            <path d="M-15 5 Q-20 0 -5 0 Q10 0 5 5 Z" fill="currentColor" className={colorClass} />
        </g>
    ),
    Rain: ({ scale = 1, colorClass = 'currentColor' }: IconComponentProps) => (
        <g transform={`scale(${scale})`}>
            <WeatherIcon.Cloud scale={1} colorClass={colorClass} /> {/* Cloud within rain icon, always full size relative to rain icon's scale */}
            {[...Array(3)].map((_, i) => (
                <line key={i} x1={-5 + i * 5} y1="5" x2={-5 + i * 5} y2="10" className={`${colorClass} rain-drop`} strokeWidth="1" strokeLinecap="round" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
        </g>
    )
};


const getWeatherIcon = (condition: string, scale: number = 1, colorClass: string = 'text-secondary') => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear') || lowerCondition.includes('صحو') || lowerCondition.includes('شمس')) return <WeatherIcon.Sun scale={scale} colorClass={colorClass} />;
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower') || lowerCondition.includes('مطر')) return <WeatherIcon.Rain scale={scale} colorClass={colorClass} />;
    if (lowerCondition.includes('cloud') || lowerCondition.includes('غائم')) return <WeatherIcon.Cloud scale={scale} colorClass={colorClass} />;
    return <g><text x="0" y="0" fontSize="10" textAnchor="middle" alignmentBaseline="middle">🌍</text></g>; // Default icon
};

const getLargeWeatherIcon = (condition: string, colorClass: string = 'text-secondary') => {
    return getWeatherIcon(condition, 2.5, colorClass); // Significantly larger scale
};


const ForecastDayColumn: React.FC<{day: WeatherDay}> = ({ day }) => (
    <div className="flex flex-col items-center space-y-1">
        <div className="w-8 h-8">
            <svg viewBox="-15 -15 30 30">{getWeatherIcon(day.condition, 0.7, 'text-primary')}</svg>
        </div>
        <span className="text-sm font-bold">{day.high}</span>
        <div className="w-1.5 h-12 bg-gradient-to-b from-red-500 via-yellow-400 to-blue-500 rounded-full my-1"></div> {/* Enhanced temperature bar */}
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
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-base-content-dark">
            {/* Current Weather - Central Animated Display */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg viewBox="-30 -30 60 60" className="w-full h-full">
                    {getLargeWeatherIcon(current.condition, 'text-secondary')}
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-4xl font-bold">{current.temperature}</p>
                </div>
            </div>
            <p className="text-lg opacity-80 mb-4">{current.condition} - {current.location}</p>

            {/* Forecast - Horizontal display */}
            <div className="flex justify-around w-full border-t border-base-dark-200 pt-4">
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

    const getTrafficAnimationClass = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('heavy')) return 'animate-[traffic-flow-heavy_6s_linear_infinite] filter drop-shadow(0_0_2px_rgba(229,57,53,0.5)) animate-[traffic-pulse-glow_2s_ease-in-out_infinite]';
        if (lowerStatus.includes('moderate')) return 'animate-[traffic-flow-moderate_4s_linear_infinite]';
        if (lowerStatus.includes('light')) return 'animate-[traffic-flow-light_3s_linear_infinite]';
        return '';
    };

    return (
        <div className="w-full h-full p-2 flex flex-col items-center justify-center text-base-content-dark">
            <h3 className="text-lg font-bold mb-4 text-primary">{traffic.overallStatus || 'Unknown'} Traffic Overall</h3>
            <svg width="100%" height="80%" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <filter id="heavy-glow">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {traffic.roads.map((road, index) => {
                    const yOffset = index * 18; // Vertical spacing between roads
                    const startY = 10 + yOffset;
                    const pathD = `M10 ${startY} C40 ${startY - 5}, 100 ${startY + 5}, 190 ${startY}`; // A slightly curved path

                    return (
                        <g key={index} className="group">
                            {/* Animated Road Path */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke={getStatusColor(road.status)}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray="8 8" // Dashes to simulate flow
                                className={`${getTrafficAnimationClass(road.status)} ${road.status.toLowerCase().includes('heavy') ? 'filter-[url(#heavy-glow)]' : ''}`}
                            />
                            {/* Road Name */}
                            <text
                                x="100"
                                y={startY - 5}
                                textAnchor="middle"
                                fontSize="7"
                                fill="currentColor"
                                className="opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                            >
                                {road.roadName}
                            </text>
                            {/* Traffic Status Text */}
                            <text
                                x="100"
                                y={startY + 10}
                                textAnchor="middle"
                                fontSize="6"
                                fill="currentColor"
                                className={`font-semibold opacity-70 group-hover:opacity-100 transition-opacity duration-200 ${road.status.toLowerCase().includes('heavy') ? 'text-accent' : ''}`}
                            >
                                {road.status}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};