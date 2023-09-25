import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import config from '../../config';

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

  // fetch data with params when params change
  const [data, setData] = useState([]);

  const svgHeight = 60;

  useEffect(() => {
    const fetchParams = {
      search: params.search ? encodeURIComponent(params.search) : undefined,
      recordtype: params.recordtype || (mode === 'transcribe' ? 'one_accession_row' : (filter || null)),
      transcriptionstatus: 'published,accession',
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

    // create fetchUrl. if value is undefined, it will be ignored
    const fetchUrl = `${config.apiUrl}collection_years?${paramString}`;

    fetch(fetchUrl, {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        setData(data.data);
      })
      .catch((err) => console.error('Något gick fel:', err));
  // when params, filter or mode change, fetch data
  }, [params, filter, mode]);

  const svgRef = useRef();
  // const bandWidth = 800 / data.length; // Assuming fixed SVG width here

  useEffect(() => {
    const newWidth = containerRef.current ? containerRef.current.offsetWidth : 800;
    setContainerWidth(newWidth);
    // bandwidth is the width of each band
    const bandWidth = containerWidth / (data.length || 1); // Assuming fixed SVG width here

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const xScale = d3.scaleBand()
      // följande gör att banden börjar vid 40px offset
      .domain(data.map((d) => d.year))
      // följande gör att banden börjar vid 40px offset, men fungerar inte med tooltip just nu
      // .range([40, containerWidth])
      .range([0, containerWidth])
      .padding(0.2);

    // Lägger till en x-axel
    const xAxis = d3.axisBottom(xScale)
      .tickValues(
        // if more than 10 years, show every 10th year
        // otherwise show every year
        (data.length > 10)
          ? xScale.domain().filter((d) => d % 10 === 0)
          : xScale.domain(),

      ); // Endast år delbara med 10

    // linear scale for y axis
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.doc_count)])
      .range([svgHeight, 0]);

    // Lägger till en y-axel
    // fungerar inte med tooltip just nu
    // const yAxis = d3.axisLeft(yScale)
    //   .ticks(5)
    //   // use swe locale for thousands separator
    //   .tickFormat((d) => d.toLocaleString('sv-SE'));

    // svg.append('g')
    //   // följande gör att y-axeln börjar vid 40px offset
    //   .attr('transform', 'translate(40,0)')
    //   .call(yAxis);

    // Lägger till horisontella linjer
    svg.selectAll('line.horizontal')
      .data(yScale.ticks(5)) // Samma antal ticks som du använde i yAxis
      .enter()
      .append('line')
      .attr('class', 'horizontal')
      // följande gör att linjerna börjar vid 40px offset,
      // ifall vi har en y-axel
      // .attr('x1', 40)
      .attr('x2', containerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 0.5);

    svg.append('g')
      .attr('transform', `translate(0,${svgHeight})`) // svgHeight höjden på din SVG.
      .call(xAxis);

    // Draw bars with blue color
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.year))
      .attr('y', (d) => yScale(d.doc_count))
      .attr('height', (d) => svgHeight - yScale(d.doc_count))
      .attr('width', xScale.bandwidth())
      .attr('fill', '#01535d'); // Bars are blue

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

    const drag = d3.drag()
      .touchable(false) // disable touch events
      .on('start', (event) => {
        dragEnd = null;
        const [x] = d3.pointer(event);
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
        svg.append('text')
          .attr('class', 'selectionStartText')
          .attr('x', dragStart - 15)
          .attr('y', 90)
          .text(dragStartYear)
          .style('font-size', '12px');

        const svgLeftOffset = svg.node().getBoundingClientRect().left;
        const x = d3.pointer(event)[0] - svgLeftOffset;
        const hoveredBand = Math.floor(
          (x - xScale.range()[0]) / bandWidth,
        );
        // offset i 1 if the selection is to the right of the start
        // offset is 0 if the selection is to the left of the start
        const dragEndOffset = x > dragStart ? 1 : 0;
        const year = xScale.domain()[hoveredBand + dragEndOffset];
        dragEnd = xScale(year);

        // if the selection is to the left of the start, increase startYear by 1
        // const dragStartYearOffset = x > dragStart ? 0 : 1;
        // we need this offset to make sure the selection rectangle is drawn correctly
        const dragStartOffset = x > dragStart ? 0 : bandWidth;

        // increase the length of the vertical line
        verticalLine.attr('y2', svgHeight + 15);

        // Remove existing selection rectangle if any
        svg.selectAll('.selectionRect').remove();
        // Draw a new selection rectangle
        svg.append('rect')
          .attr('class', 'selectionRect')
          .attr('x', Math.min(dragStart, dragEnd))
          .attr('y', 0)
          .attr('width', Math.abs(dragEnd - (dragStart + dragStartOffset)))
          .attr('height', svgHeight)
          .attr('fill', '#ddd')
          .attr('opacity', 0.5);

        otherVerticalLine.style('display', null).attr('x1', x).attr('x2', x);

        if (Math.abs(dragStartYear - year) > 1) {
          // if the selection is to the right of the start, decrease endYear by 1
          const offset = dragEnd > dragStart ? -1 : 0;
          svg
            .append('text')
            .attr('class', 'selectionEndText')
            .attr('x', dragEnd - 15)
            .attr('y', 90)
            .text(parseInt(year, 10) + offset)
            .style('font-size', '12px');
          // add a border around the text
        }
      })
      .on('end', () => {
        if (dragEnd !== null) {
          const hoveredBandStart = Math.floor((dragStart - xScale.range()[0]) / bandWidth);
          const firstYear = xScale.domain()[hoveredBandStart];
          const hoveredBandEnd = Math.floor((dragEnd - xScale.range()[0]) / bandWidth);
          // if the selection is to the right of the start, decrease endYear by 1
          const offset = dragEnd > dragStart ? -1 : 0;
          const lastYear = parseInt(xScale.domain()[hoveredBandEnd], 10) + offset;

          onYearFilter(
            Math.min(firstYear, lastYear),
            Math.max(firstYear, lastYear),
          );
        } else {
          resetOnYearFilter();
        }
      });

    svg.call(drag);

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
      const [x, y] = d3.pointer(event);

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
      // const xPos = xScale(year);
      // verticalLine.style('display', null).attr('x1', xPos).attr('x2', xPos);
      // non-sticky vertical line:
      // if (x < 40) { // 40 är x-offseten för y-axeln
      //   // visa inte linjen om muspekaren är till vänster om y-axeln
      //   verticalLine.style('display', 'none');
      // } else {
      verticalLine.style('display', null).attr('x1', x).attr('x2', x);
      // }
      otherVerticalLine.style('display', 'none');

      tooltip.select('text')
        .text(`${year}: ${value} ${
          value > 1 ? 'sökträffar' : (value === 1 ? 'sökträff' : 'sökträffar')
        }`);

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
      // tooltip.style('display', 'none');
    });

    // Add sliders here, if you wish
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
