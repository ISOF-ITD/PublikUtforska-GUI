import PropTypes from "prop-types";
import { memo } from "react";

const Card = memo(function Card({ children }) {
  return (
    <section className="bg-surface rounded-xl shadow-sm border-1 border-solid border-border overflow-hidden">
      <div className="lg:p-2 p-4">{children}</div>
    </section>
  );
});

Card.propTypes = { children: PropTypes.node.isRequired };

export default Card;
