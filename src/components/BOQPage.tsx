/**
 * SAQR AI - Premium BOQ Page
 *
 * Professional engineering cost center with editable live BOQ items.
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';

import { BOQSummaryCard, ConfidenceMeter, ReviewWarning, SAQRFlow, SystemBadge } from './designSystem';
import type { BOQItem } from '../data/mockData';

interface BOQPageProps {
  boqItems: BOQItem[];
  setBoqItems: React.Dispatch<React.SetStateAction<BOQItem[]>>;
  projectName: string;
  clientName: string;
  totalBOQValue: number;
  onRegenerateBOQ?: () => void;
  isGenerating?: boolean;
}

const costColors = ['#D6A84F', '#22D3EE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const EnhancedBOQPage: React.FC<BOQPageProps> = ({
  boqItems,
  setBoqItems,
  projectName,
  clientName,
  totalBOQValue,
  onRegenerateBOQ,
  isGenerating = false
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const systemBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; value: number; items: BOQItem[] }> = {};

    boqItems.forEach((item) => {
      if (!breakdown[item.category]) {
        breakdown[item.category] = { count: 0, value: 0, items: [] };
      }
      breakdown[item.category].count += item.quantity;
      breakdown[item.category].value += item.total;
      breakdown[item.category].items.push(item);
    });

    const denominator = totalBOQValue > 0 ? totalBOQValue : 1;
    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
      items: data.items,
      percentage: Number(((data.value / denominator) * 100).toFixed(1))
    }));
  }, [boqItems, totalBOQValue]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'All') return boqItems;
    return boqItems.filter((item) => item.category === filterCategory);
  }, [boqItems, filterCategory]);

  const lowConfidenceItems = useMemo(() => (
    boqItems.filter((item) => item.confidenceLevel === 'Low' || item.confidenceLevel === 'Needs Review')
  ), [boqItems]);

  const updateItem = (id: string, updates: Partial<BOQItem>) => {
    setBoqItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const quantity = updates.quantity ?? item.quantity;
      const unitRate = updates.unitRate ?? item.unitRate;
      return {
        ...item,
        ...updates,
        quantity,
        unitRate,
        total: Math.round(quantity * unitRate)
      };
    }));
  };

  const handleDeleteItem = (id: string) => {
    setBoqItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const nextNumber = boqItems.length + 1;
    const newItem: BOQItem = {
      id: `custom-boq-${nextNumber}`,
      category: 'Labor & Services',
      itemCode: `CUS-${String(nextNumber).padStart(3, '0')}`,
      description: 'Engineer-added BOQ allowance item',
      unit: 'lot',
      quantity: 1,
      unitRate: 1000,
      total: 1000,
      confidenceLevel: 'Needs Review',
      source: 'Engineer override',
      notes: 'Added manually for engineer review.'
    };
    setBoqItems((prev) => [newItem, ...prev]);
    setFilterCategory('All');
  };

  return (
    <div className="boq-page">
      <header className="module-hero">
        <div>
          <span className="module-kicker">Engineering Cost Center</span>
          <h1><FileText size={30} /> BOQ & Cost Estimate</h1>
          <p>
            Editable preliminary bill of quantities for <strong>{projectName}</strong>, prepared for {clientName}.
          </p>
        </div>
        <ReviewWarning />
      </header>

      <section className="boq-summary-grid">
        <BOQSummaryCard
          totalValue={totalBOQValue}
          itemCount={boqItems.length}
          systems={systemBreakdown.map((s) => s.category)}
          confidence={lowConfidenceItems.length === 0 ? 'High' : 'Medium'}
          lastGenerated="Today"
        />

        <div className="boq-process-card">
          <h2><AlertTriangle size={18} /> BOQ Generation Explanation</h2>
          <SAQRFlow
            compact
            steps={[
              { title: 'Rooms' },
              { title: 'Engineering Calculations' },
              { title: 'System Points' },
              { title: 'BOQ Items' },
              { title: 'Estimated Cost' }
            ]}
          />
          <p>
            SAQR maps room schedules into lighting, power, and ELV point assumptions, then converts those quantities into editable cost lines. Rates remain preliminary until procurement and engineer review.
          </p>
        </div>
      </section>

      <section className="boq-breakdown-section">
        <div className="section-title-row">
          <div>
            <span>System Breakdown</span>
            <h2>Cost distribution by engineering system</h2>
          </div>
        </div>

        <div className="boq-breakdown-grid">
          {systemBreakdown.map((system) => (
            <article key={system.category} className="boq-system-card">
              <div>
                <SystemBadge system={system.category} count={system.count} />
                <strong>QAR {system.value.toLocaleString()}</strong>
              </div>
              <div className="boq-system-bar">
                <span style={{ width: `${Math.min(system.percentage, 100)}%` }} />
              </div>
              <p>{system.items.length} line items • {system.percentage}% of estimate</p>
            </article>
          ))}
        </div>
      </section>

      <section className="boq-analytics-grid">
        <div className="chart-panel">
          <h3>Cost Share by System</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={systemBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                nameKey="category"
              >
                {systemBreakdown.map((_, idx) => (
                  <Cell key={`cost-cell-${idx}`} fill={costColors[idx % costColors.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value) => `QAR ${Number(value).toLocaleString()}`}
                contentStyle={{ backgroundColor: 'rgba(7,17,31,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel">
          <h3>System-wise Cost Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={systemBreakdown} margin={{ top: 8, right: 12, left: 0, bottom: 18 }}>
              <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#22D3EE" fontSize={10} />
              <RechartsTooltip
                formatter={(value) => `QAR ${Number(value).toLocaleString()}`}
                contentStyle={{ backgroundColor: 'rgba(7,17,31,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#22D3EE" name="Cost (QAR)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="boq-table-section">
        <div className="section-title-row">
          <div>
            <span>Editable BOQ Table</span>
            <h2>Detailed bill of quantities</h2>
          </div>
          <div className="boq-filter-row">
            {['All', 'Lighting', 'Power', 'ELV', 'Containment', 'Labor & Services'].map((category) => (
              <button
                key={category}
                type="button"
                className={filterCategory === category ? 'active' : ''}
                onClick={() => setFilterCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container boq-table-container">
          <table className="eng-table boq-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>System</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Rate</th>
                <th>Total</th>
                <th>Confidence</th>
                <th>Source / Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="mono-cell">{item.itemCode}</td>
                  <td><SystemBadge system={item.category} /></td>
                  <td>
                    <input
                      aria-label={`Description for ${item.itemCode}`}
                      value={item.description}
                      onChange={(event) => updateItem(item.id, { description: event.target.value })}
                      className="boq-inline-input boq-description-input"
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Quantity for ${item.itemCode}`}
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) || 0 })}
                      className="boq-inline-input number-input"
                    />
                  </td>
                  <td>{item.unit}</td>
                  <td>
                    <input
                      aria-label={`Unit rate for ${item.itemCode}`}
                      type="number"
                      value={item.unitRate}
                      onChange={(event) => updateItem(item.id, { unitRate: Number(event.target.value) || 0 })}
                      className="boq-inline-input number-input"
                    />
                  </td>
                  <td className="amount-cell">QAR {item.total.toLocaleString()}</td>
                  <td><ConfidenceMeter level={item.confidenceLevel} /></td>
                  <td className="source-cell">{item.source}</td>
                  <td>
                    <button type="button" className="icon-button danger" title="Delete BOQ item" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="boq-table-footer">
            <span>{filteredItems.length} visible items • {boqItems.length} total</span>
            <strong>Total: QAR {totalBOQValue.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {lowConfidenceItems.length > 0 && (
        <section className="review-panel">
          <h2><AlertTriangle size={18} /> Engineer Review Required</h2>
          <p>{lowConfidenceItems.length} BOQ items have low confidence or require manual engineering confirmation before procurement.</p>
          <div>
            {lowConfidenceItems.map((item) => (
              <article key={item.id}>
                <strong>{item.itemCode}</strong>
                <span>{item.description}</span>
                <ConfidenceMeter level={item.confidenceLevel} />
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="module-action-row">
        <button type="button" className="btn-cyan" onClick={onRegenerateBOQ} disabled={isGenerating}>
          <RefreshCw size={16} />
          {isGenerating ? 'Regenerating BOQ...' : 'Regenerate BOQ from Current Rooms'}
        </button>
        <button type="button" className="btn-outline" onClick={() => alert('BOQ report export queued.')}>
          <Download size={16} />
          Export Report
        </button>
        <button type="button" className="btn-gold" onClick={handleAddItem}>
          <Plus size={16} />
          Add Custom Item
        </button>
      </div>
    </div>
  );
};
