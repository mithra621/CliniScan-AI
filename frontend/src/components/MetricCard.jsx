import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  accentColor = '#0284c7', 
  iconBg = '#f0f9ff',
  badgeText
}) {
  return (
    <div className="metric-card" style={{ '--card-accent': accentColor }}>
      <div className="metric-header">
        <span>{title}</span>
        <div 
          className="metric-icon-box"
          style={{ '--icon-bg': iconBg, '--icon-color': accentColor }}
        >
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <div className="metric-value">
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="metric-desc">{subtext}</span>
        {badgeText && (
          <span className="badge badge-blue">{badgeText}</span>
        )}
      </div>
    </div>
  );
}
