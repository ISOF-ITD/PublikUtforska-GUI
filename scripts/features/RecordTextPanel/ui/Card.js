import PropTypes from "prop-types";
import { memo } from "react";

const Card = memo(function Card({ children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border-1 border-solid border-black/5 overflow-hidden">
      <div className="lg:p-2 p-4">{children}</div>
    </section>
  );
});

Card.propTypes = { children: PropTypes.node.isRequired };

export default Card;
