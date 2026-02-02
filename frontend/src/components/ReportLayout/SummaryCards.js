/**
 * SummaryCards Component
 * Displays KPI/summary cards in a grid layout
 * Optimized with React.memo for better performance
 */

import React, { memo } from 'react';
import { Row, Col, Card } from 'antd';
import PropTypes from 'prop-types';

/**
 * SummaryCard Item
 * @typedef {Object} SummaryCard
 * @property {string|number} value - Card value
 * @property {string} label - Card label
 * @property {string} color - Optional color for value
 * @property {number} span - Grid span (default: 6)
 */

/**
 * SummaryCards Component
 * @param {Object} props
 * @param {Array<SummaryCard>} props.cards - Array of card data
 * @param {string} props.className - Additional CSS class
 */
const SummaryCards = ({ cards = [], className = '' }) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <Row gutter={[16, 16]} className={`kpi-section ${className}`}>
      {cards.map((card, index) => (
        <Col
          key={index}
          xs={24}
          sm={12}
          md={8}
          lg={card.span || 6}
        >
          <Card className="kpi-card">
            <div
              className="kpi-value"
              style={card.color ? { color: card.color } : {}}
            >
              {card.value}
            </div>
            <div className="kpi-label">{card.label}</div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

SummaryCards.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string,
      span: PropTypes.number,
    })
  ),
  className: PropTypes.string,
};

// Memoize component to prevent unnecessary re-renders
export default memo(SummaryCards, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.cards?.length !== nextProps.cards?.length) return false;
  
  // Deep comparison of cards array
  if (prevProps.cards && nextProps.cards) {
    return prevProps.cards.every((card, index) => {
      const nextCard = nextProps.cards[index];
      return (
        card.value === nextCard.value &&
        card.label === nextCard.label &&
        card.color === nextCard.color &&
        card.span === nextCard.span
      );
    });
  }
  
  return true;
});
