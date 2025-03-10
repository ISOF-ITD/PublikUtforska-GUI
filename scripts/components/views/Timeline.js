import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import config from '../../config';

// Import only the necessary parts from d3
import { select, pointer } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { max } from 'd3-array';
import { drag } from 'd3-drag';

function Timeline({
  containerRef, params, filter, mode, onYearFilter, resetOnYearFilter,
}) {
  Timeline.propTypes = {
    containerRef: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    filter: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    onYearFilter: PropTypes.func.isRequired,
    resetOnYearFilter: PropTypes.func.isRequired,
  };

  const [containerWidth, setContainerWidth] = useState(800); // default value

  // fetch data med params när params ändras
  const [data, setData] = useState([]);

  const svgHeight = 60;

  function selectionTextPosition(dragStart, dragEnd) {
    let dragStartOffset = 0;
    let dragEndOffset = 0;
    // dra till vänster
    if (dragEnd < dragStart) {
      // default offset för dragEnd är -10
      dragEndOffset = -20;
      // om dragStart är för nära högra kanten, flytta textpositionen åt vänster
      dragStartOffset = dragStart > containerWidth - 40 ? -15 : dragStartOffset;
      // om samma som ovan och dragEnd är till vänster om dragStart,
      // och dragEnd bara är en etikett bort från dragStart, flytta textpositionen åt vänster
      dragEndOffset = dragStart > containerWidth - 40
        && (dragStart - dragEnd) < 80 ? dragStartOffset * 2 : dragEndOffset;
      // om dragStart är för nära vänstra kanten, flytta textpositionen åt höger
      dragStartOffset = dragStart < 80 ? 15 : dragStartOffset;
      // dra till höger eller bara en punkt
    } else {
      // default offset för dragEnd är 10
      // dragEndOffset = 0;
      // om dragEnd - dragStart bara är en etikett bort från dragStart, sätt dragEndOffset till 15
      dragEndOffset = (dragEnd - dragStart) < 30 ? 15 : dragEndOffset;
      // om dragEnd är för nära vänstra kanten, flytta textpositionen åt höger
      dragEndOffset = dragEnd < 40 ? 15 : dragEndOffset;
      // om dragEnd är nära högra kanten, och dragStart bara är en etikett bort från dragEnd,
      // flytta textpositionen för dragStart åt vänster
      dragStartOffset = dragEnd > containerWidth - 40
        && (dragEnd - dragStart) < 30 ? -30 : dragStartOffset;
    }
    return {
      start: dragStart + dragStartOffset,
      end: dragEnd + dragEndOffset,
    };
  }

  useEffect(() => {
    const fetchParams = {
      search: params.search ? encodeURIComponent(params.search) : undefined,
      recordtype: params.recordtype || (mode === 'transcribe' ? 'one_accession_row' : (filter || null)),
      transcriptionstatus: 'published,accession',
      category: params.category ? encodeURIComponent(params.category) : undefined,
    };

    const paramStrings = [];

    const filteredParams = Object.fromEntries(
      Object.entries(fetchParams).filter(([, value]) => value !== null && value !== undefined),
    );
    const queryParams = { ...config.requiredParams, ...filteredParams };

    // Anpassa params till ES Djangi api
    if (queryParams.search) {
      if (queryParams.search_field === 'person') {
        queryParams.person = queryParams.search;
        delete queryParams.search;
      }
      if (queryParams.search_field === 'place') {
        queryParams.place = queryParams.search;
        delete queryParams.search;
      }
      delete queryParams.search_field;
    }

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) {
        paramStrings.push(`${key}=${value}`);
      }
    });

    const paramString = paramStrings.join('&');

    // Skapa fetchUrl. Om värde är undefined så ignoreras det
    const fetchUrl = `${config.apiUrl}collection_years/?${paramString}`;

    fetch(fetchUrl, {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        setData(data.data);
      })
      .catch((err) => console.error('Något gick fel:', err));
  // När params, filter eller mode ändras, hämta data
  }, [params, filter, mode]);

  const svgRef = useRef();

  useEffect(() => {
    const newWidth = containerRef.current ? containerRef.current.offsetWidth : 800;
    setContainerWidth(newWidth);
    // bandWidth is the width of each band
    const bandWidth = containerWidth / (data.length || 1);

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const xScale = scaleBand()
      // följande gör att banden börjar vid 40px offset
      .domain(data.map((d) => d.year))
      .range([0, containerWidth])
      .padding(0.2);

    // Lägg till en x-axel
    const xAxis = axisBottom(xScale)
      .tickValues(
        // if more than 10 years, show every 10th year
        // otherwise show every year
        (data.length > 10)
          ? xScale.domain().filter((d) => d % 10 === 0)
          : xScale.domain(),
      );

    // linear scale for y axis
    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.doc_count)])
      .range([svgHeight, 0]);

    // Lägg till horisontella linjer
    svg.selectAll('line.horizontal')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'horizontal')
      .attr('x2', containerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 0.5);

    svg.append('g')
      .attr('transform', `translate(0,${svgHeight})`)
      .call(xAxis);

    const minBarHeight = 3; // Minsta stapelhöjd i pixlar

    svg.selectAll('rect.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.year))
      .attr('y', (d) => (d.doc_count > 0 ? Math.min(yScale(d.doc_count), svgHeight - minBarHeight) : yScale(d.doc_count)))
      .attr('height', (d) => (d.doc_count > 0 ? Math.max(svgHeight - yScale(d.doc_count), minBarHeight) : svgHeight - yScale(d.doc_count)))
      .attr('width', xScale.bandwidth())
      .attr('fill', '#01535d');

    const verticalLine = svg.append('line')
      .style('display', 'none')
      .style('stroke', 'black')
      .style('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', svgHeight);

    const otherVerticalLine = svg.append('line')
      .style('display', 'none')
      .style('stroke', 'black')
      .style('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', svgHeight + 15);

    // Add drag functionality
    let dragStart = null;
    let dragEnd = null;
    let dragStartYear = null;

    const svgLeftOffset = svg.node().getBoundingClientRect().left;

    const d3Drag = drag()
      .touchable(false) // disable touch events
      .on('start', (event) => {
        dragEnd = null;
        const [x] = pointer(event);
        const hoveredBand = Math.floor((x - xScale.range()[0]) / bandWidth);
        const year = xScale.domain()[hoveredBand];
        dragStartYear = year;
        dragStart = xScale(year);
        svg.selectAll('.selectionStartText').remove();
        svg.selectAll('.selectionEndText').remove();

        // Remove existing selection rectangle if any
        svg.selectAll('.selectionRect').remove();
      })
      .on('drag', (event) => {
        svg.selectAll('.selectionStartText').remove();
        svg.selectAll('.selectionEndText').remove();

        // add text to the start of the selection
        svg.append('text')
          .attr('class', 'selectionStartText')
          .attr('x', selectionTextPosition(dragStart, dragEnd).start)
          .attr('y', 90)
          .text(dragStartYear)
          .style('font-size', '12px');

        const x = pointer(event)[0] - svgLeftOffset;
        const hoveredBand = Math.floor((x - xScale.range()[0]) / bandWidth);
        const year = xScale.domain()[hoveredBand]
          || xScale.domain()[
            dragEnd > dragStart ? xScale.domain().length - 1 : 0
          ];
        dragEnd = xScale(year);

        // we need this offset to make sure the selection rectangle is drawn correctly
        const dragStartOffset = dragEnd > dragStart ? 0 : bandWidth;
        const dragEndOffset = dragEnd > dragStart ? bandWidth : 0;

        // increase the length of the vertical line
        verticalLine.attr('y2', svgHeight + 15);

        // Remove existing selection rectangle if any
        svg.selectAll('.selectionRect').remove();
        // Draw a new selection rectangle
        svg.append('rect')
          .attr('class', 'selectionRect')
          .attr('x', Math.min(dragStart, dragEnd))
          .attr('y', 0)
          .attr('width', Math.abs(dragEnd + dragEndOffset - (dragStart + dragStartOffset)))
          .attr('height', svgHeight)
          .attr('fill', '#ddd')
          .attr('opacity', 0.5);

        otherVerticalLine.style('display', null).attr('x1', x).attr('x2', x);

        // add text to the end of the selection
        const endSelectionTextElement = svg.append('text')
          .attr('class', 'selectionEndText')
          .attr('x', selectionTextPosition(dragStart, dragEnd).end)
          .attr('y', 90)
          .text(dragEnd !== dragStart ? parseInt(year, 10) : '')
          .style('font-size', '12px');

        // if the left edge of the selection text is outside the svg, move it inside
        const selectionTextLeftEdge = endSelectionTextElement.node().getBoundingClientRect().left;
        if (selectionTextLeftEdge < svgLeftOffset) {
          endSelectionTextElement.attr('x', 0);
          endSelectionTextElement.attr('text-anchor', 'start');
        }
        // if the right edge of the selection text is outside the svg, move it inside
        const selectionTextRightEdge = endSelectionTextElement.node().getBoundingClientRect().right;
        if (selectionTextRightEdge > containerWidth + svgLeftOffset) {
          endSelectionTextElement.attr('x', containerWidth - 25);
        }
      })
      .on('end', () => {
        if (dragEnd !== null) {
          const hoveredBandStart = Math.floor((dragStart - xScale.range()[0]) / bandWidth);
          const firstYear = xScale.domain()[hoveredBandStart];
          const hoveredBandEnd = Math.floor((dragEnd - xScale.range()[0]) / bandWidth);
          const lastYear = parseInt(xScale.domain()[hoveredBandEnd], 10);

          onYearFilter(
            Math.min(firstYear, lastYear),
            Math.max(firstYear, lastYear),
          );
        } else {
          resetOnYearFilter();
        }
      });

    svg.call(d3Drag);

    const tooltip = svg.append('g')
      .style('display', 'none');

    // Lägg till en <rect> till tooltip
    tooltip.append('rect')
      .attr('width', 150) // ändra som du vill
      .attr('height', 20) // ändra som du vill
      .attr('fill', 'beige')
      .attr('stroke', 'black');

    tooltip.append('text')
      .attr('x', 10)
      .attr('y', 15); // justera så att texten hamnar mitt i rektangeln

    svg.on('mousemove', (event) => {
      const [x, y] = pointer(event);

      const hoveredBand = Math.floor((x - xScale.range()[0]) / bandWidth);
      const year = xScale.domain()[hoveredBand];

      const found = data.find((d) => d.year === year);
      if (!found) {
        // gör inget om vi inte hittar data för det året
        return;
      }
      const value = found.doc_count;

      const tooltipWidth = 150; // Samma bredd som du har satt på din tooltip
      const tooltipHeight = 20; // Samma höjd som du har satt på din tooltip

      // for tooltip:
      const xOffset = x + tooltipWidth > containerWidth ? -tooltipWidth - 10 : 10;
      const yOffset = y + tooltipHeight > 200 ? -tooltipHeight - 1 : 1;

      // sticky vertical line:
      verticalLine.style('display', null).attr('x1', x).attr('x2', x);
      otherVerticalLine.style('display', 'none');

      tooltip.select('text')
        .text(`${year}: ${value} ${value > 1 ? 'sökträffar' : (value === 1 ? 'sökträff' : 'sökträffar')}`);

      // visa inte tooltip om muspekaren är nedanför x-axeln
      if (y > svgHeight) {
        tooltip.style('display', 'none');
      } else {
        tooltip
          .style('display', null)
          .attr('transform', `translate(${x + xOffset}, ${y + yOffset})`);
      }
    });

    svg.on('mouseleave', () => {
      verticalLine.style('display', 'none');
    });
  }, [data, containerRef.current, containerWidth]);

  useEffect(() => {
    const updateWidth = () => {
      // set container width to containerRefs offsetWidth
      const newWidth = containerRef.current ? containerRef.current.offsetWidth : 800;
      setContainerWidth(newWidth);
    };

    // Uppdatera bredden när komponenten monteras
    updateWidth();

    // Lyssna på resize-händelsen
    window.addEventListener('resize', updateWidth);

    // Rensa upp efter sig när komponenten avmonteras
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  return <svg ref={svgRef} width={containerWidth} height={svgHeight + 30} />;
}

export default Timeline;
