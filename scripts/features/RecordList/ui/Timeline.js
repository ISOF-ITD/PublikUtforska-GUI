import {
  useEffect, useId, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { max } from 'd3-array';
import { axisBottom } from 'd3-axis';
import { drag } from 'd3-drag';
import { scaleBand, scaleLinear } from 'd3-scale';
import { pointer, select } from 'd3-selection';

import config from '../../../config';
import { l } from '../../../lang/Lang';

const SVG_HEIGHT = 60;

const formatHitCount = (count) => (
  `${count} ${count === 1 ? l('sökträff') : l('sökträffar')}`
);

const normalizeTimelineData = (payloadData) => {
  if (!Array.isArray(payloadData)) return [];

  return payloadData
    .map((item) => ({
      year: Number(item?.year),
      doc_count: Number(item?.doc_count) || 0,
    }))
    .filter((item) => Number.isInteger(item.year))
    .sort((first, second) => first.year - second.year);
};

const getRecordType = (params, mode, filter) => {
  if (params.recordtype) return params.recordtype;
  if (mode === 'transcribe') return 'one_accession_row,one_audio_record';
  return filter || null;
};

const getFetchUrl = (params, mode, filter) => {
  const queryParams = {
    ...config.requiredParams,
    search: params.search || undefined,
    search_field: params.search_field || undefined,
    person: params.person || undefined,
    place: params.place || undefined,
    archive_id: params.archive_id || undefined,
    recordtype: getRecordType(params, mode, filter),
    transcriptionstatus: 'published,accession,readytocontribute,readytotranscribe,undertranscription',
    category: params.category || undefined,
  };

  if (queryParams.search) {
    if (queryParams.search_field === 'person') {
      queryParams.person = queryParams.search;
      delete queryParams.search;
    } else if (queryParams.search_field === 'place') {
      queryParams.place = queryParams.search;
      delete queryParams.search;
    } else if (queryParams.search_field === 'archive_id') {
      queryParams.archive_id = queryParams.search;
      delete queryParams.search;
    }
    delete queryParams.search_field;
  }

  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, value);
    }
  });

  return `${config.apiUrl}collection_years/?${searchParams.toString()}`;
};

const getSelectionTextPosition = (dragStart, dragEnd, containerWidth) => {
  let dragStartOffset = 0;
  let dragEndOffset = 0;

  if (dragEnd < dragStart) {
    dragEndOffset = -20;
    dragStartOffset = dragStart > containerWidth - 40 ? -15 : dragStartOffset;
    dragEndOffset = dragStart > containerWidth - 40
      && (dragStart - dragEnd) < 80
      ? dragStartOffset * 2
      : dragEndOffset;
    dragStartOffset = dragStart < 80 ? 15 : dragStartOffset;
  } else {
    dragEndOffset = (dragEnd - dragStart) < 30 ? 15 : dragEndOffset;
    dragEndOffset = dragEnd < 40 ? 15 : dragEndOffset;
    dragStartOffset = dragEnd > containerWidth - 40
      && (dragEnd - dragStart) < 30
      ? -30
      : dragStartOffset;
  }

  return {
    start: dragStart + dragStartOffset,
    end: dragEnd + dragEndOffset,
  };
};

function Timeline({
  containerRef,
  params,
  filter,
  yearFilter,
  mode,
  onYearFilter,
  resetOnYearFilter,
}) {
  const [containerWidth, setContainerWidth] = useState(800);
  const [data, setData] = useState([]);
  const [fetchStatus, setFetchStatus] = useState('loading');
  const [fromYearInput, setFromYearInput] = useState('');
  const [toYearInput, setToYearInput] = useState('');
  const [formError, setFormError] = useState('');
  const [filterAnnouncement, setFilterAnnouncement] = useState('');
  const abortRef = useRef(null);
  const svgRef = useRef(null);
  const headingId = useId();
  const instructionsId = useId();
  const summaryId = useId();
  const dataHeadingId = useId();
  const formErrorId = useId();
  const fromYearInputId = useId();
  const toYearInputId = useId();

  const timelineStats = useMemo(() => {
    if (!data.length) return null;

    const totalHits = data.reduce(
      (sum, item) => sum + item.doc_count,
      0,
    );
    const peak = data.reduce((currentPeak, item) => (
      item.doc_count > currentPeak.doc_count ? item : currentPeak
    ));

    return {
      firstYear: data[0].year,
      lastYear: data[data.length - 1].year,
      peak,
      totalHits,
    };
  }, [data]);

  const timelineSummary = useMemo(() => {
    if (fetchStatus === 'loading') return 'Laddar tidslinjens data…';
    if (fetchStatus === 'error') return 'Tidslinjens data kunde inte hämtas.';
    if (fetchStatus === 'empty' || !timelineStats) {
      return 'Det finns inga sökträffar per år i det aktuella urvalet.';
    }

    return `Totalt ${formatHitCount(timelineStats.totalHits)} från år ${timelineStats.firstYear} till ${timelineStats.lastYear}. Flest sökträffar finns år ${timelineStats.peak.year} med ${formatHitCount(timelineStats.peak.doc_count)}.`;
  }, [fetchStatus, timelineStats]);

  const hasYearRange = Array.isArray(yearFilter) && yearFilter.length === 2;
  const hasDraftRange = fromYearInput !== '' || toYearInput !== '';

  useEffect(() => {
    if (hasYearRange) {
      setFromYearInput(String(yearFilter[0]));
      setToYearInput(String(yearFilter[1]));
    } else {
      setFromYearInput('');
      setToYearInput('');
    }
    setFormError('');
  }, [hasYearRange, yearFilter]);

  useEffect(() => {
    const fetchUrl = getFetchUrl(params, mode, filter);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setData([]);
    setFetchStatus('loading');

    const handler = window.setTimeout(() => {
      fetch(fetchUrl, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Timeline fetch failed: ${response.status}`);
          }
          return response.json();
        })
        .then((payload) => {
          if (!controller.signal.aborted) {
            const nextData = normalizeTimelineData(payload?.data);
            setData(nextData);
            setFetchStatus(nextData.length ? 'ready' : 'empty');
          }
        })
        .catch((error) => {
          if (error?.name !== 'AbortError' && !controller.signal.aborted) {
            setData([]);
            setFetchStatus('error');
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(handler);
      controller.abort();
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    };
  }, [filter, mode, params]);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    if (!data.length) {
      return () => {
        svg.selectAll('*').remove();
      };
    }

    const width = containerRef.current?.offsetWidth || 800;
    const yearDomain = data.map((item) => item.year);
    setContainerWidth(width);

    const xScale = scaleBand()
      .domain(yearDomain)
      .range([0, width])
      .padding(0.2);
    const xAxis = axisBottom(xScale)
      .tickValues(
        data.length > 10
          ? yearDomain.filter((year) => year % 10 === 0)
          : yearDomain,
      );
    const maxHitCount = max(data, (item) => item.doc_count) || 0;
    const yScale = scaleLinear()
      .domain([0, Math.max(maxHitCount, 1)])
      .range([SVG_HEIGHT, 0]);
    const bandStep = xScale.step();
    const minBarHeight = 3;
    const yearAtPosition = (position) => {
      const clampedPosition = Math.min(Math.max(position, 0), width - 1);
      const index = Math.min(
        yearDomain.length - 1,
        Math.floor(clampedPosition / bandStep),
      );
      return yearDomain[index];
    };

    svg.selectAll('line.horizontal')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'horizontal')
      .attr('x2', width)
      .attr('y1', (value) => yScale(value))
      .attr('y2', (value) => yScale(value))
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 0.5);

    svg.append('g')
      .attr('transform', `translate(0,${SVG_HEIGHT})`)
      .call(xAxis);

    if (hasYearRange) {
      const selectedStartYear = yearDomain.find((year) => year >= yearFilter[0]);
      const selectedEndYear = [...yearDomain]
        .reverse()
        .find((year) => year <= yearFilter[1]);

      if (selectedStartYear !== undefined
        && selectedEndYear !== undefined
        && selectedStartYear <= selectedEndYear) {
        const selectionStart = xScale(selectedStartYear);
        const selectionEnd = xScale(selectedEndYear) + xScale.bandwidth();

        svg.append('rect')
          .attr('class', 'selectionRect')
          .attr('x', selectionStart)
          .attr('y', 0)
          .attr('width', selectionEnd - selectionStart)
          .attr('height', SVG_HEIGHT)
          .attr('fill', 'var(--color-surface-active)')
          .attr('opacity', 0.5)
          .attr('pointer-events', 'none');
      }
    }

    svg.selectAll('rect.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .style('cursor', 'pointer')
      .attr('x', (item) => xScale(item.year))
      .attr('y', (item) => (
        item.doc_count > 0
          ? Math.min(yScale(item.doc_count), SVG_HEIGHT - minBarHeight)
          : yScale(item.doc_count)
      ))
      .attr('height', (item) => (
        item.doc_count > 0
          ? Math.max(SVG_HEIGHT - yScale(item.doc_count), minBarHeight)
          : SVG_HEIGHT - yScale(item.doc_count)
      ))
      .attr('width', xScale.bandwidth())
      .attr('fill', 'var(--color-primary)');

    const verticalLine = svg.append('line')
      .style('display', 'none')
      .style('stroke', 'var(--color-text)')
      .style('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', SVG_HEIGHT);
    const otherVerticalLine = svg.append('line')
      .style('display', 'none')
      .style('stroke', 'var(--color-text)')
      .style('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', SVG_HEIGHT + 15);
    const svgLeftOffset = svg.node().getBoundingClientRect().left;
    let dragStart = null;
    let dragEnd = null;
    let dragStartYear = null;

    const dragBehavior = drag()
      .on('start', (event) => {
        const [position] = pointer(event, svg.node());
        dragEnd = null;
        dragStartYear = yearAtPosition(position);
        dragStart = xScale(dragStartYear);
        svg.selectAll('.selectionStartText, .selectionEndText, .selectionRect').remove();
      })
      .on('drag', (event) => {
        const [position] = pointer(event, svg.node());
        const dragEndYear = yearAtPosition(position);
        dragEnd = xScale(dragEndYear);
        const textPositions = getSelectionTextPosition(
          dragStart,
          dragEnd,
          containerWidth,
        );
        const dragStartOffset = dragEnd > dragStart ? 0 : bandStep;
        const dragEndOffset = dragEnd > dragStart ? bandStep : 0;

        svg.selectAll('.selectionStartText, .selectionEndText, .selectionRect').remove();
        svg.append('text')
          .attr('class', 'selectionStartText')
          .attr('x', textPositions.start)
          .attr('y', SVG_HEIGHT + 30)
          .attr('fill', 'var(--color-text)')
          .style('font-size', '12px')
          .text(dragStartYear);
        svg.append('rect')
          .attr('class', 'selectionRect')
          .attr('x', Math.min(dragStart, dragEnd))
          .attr('y', 0)
          .attr('width', Math.abs(
            dragEnd + dragEndOffset - (dragStart + dragStartOffset),
          ))
          .attr('height', SVG_HEIGHT)
          .attr('fill', 'var(--color-surface-active)')
          .attr('opacity', 0.5)
          .attr('pointer-events', 'none');

        const endSelectionText = svg.append('text')
          .attr('class', 'selectionEndText')
          .attr('x', textPositions.end)
          .attr('y', SVG_HEIGHT + 30)
          .attr('fill', 'var(--color-text)')
          .style('font-size', '12px')
          .text(dragEnd !== dragStart ? dragEndYear : '');
        const selectionTextBounds = endSelectionText.node().getBoundingClientRect();

        if (selectionTextBounds.left < svgLeftOffset) {
          endSelectionText.attr('x', 0).attr('text-anchor', 'start');
        } else if (selectionTextBounds.right > containerWidth + svgLeftOffset) {
          endSelectionText.attr('x', containerWidth - 25);
        }

        verticalLine.attr('y2', SVG_HEIGHT + 15);
        otherVerticalLine
          .style('display', null)
          .attr('x1', position)
          .attr('x2', position);
      })
      .on('end', () => {
        if (dragEnd !== null) {
          const dragEndYear = yearAtPosition(dragEnd);
          const fromYear = Math.min(dragStartYear, dragEndYear);
          const toYear = Math.max(dragStartYear, dragEndYear);

          setFilterAnnouncement(`Visar sökträffar från år ${fromYear} till ${toYear}.`);
          onYearFilter(fromYear, toYear);
        } else {
          setFilterAnnouncement('Årsfiltret har rensats.');
          resetOnYearFilter();
        }
      });

    svg.call(dragBehavior);

    const tooltip = svg.append('g')
      .attr('pointer-events', 'none')
      .style('display', 'none');
    tooltip.append('rect')
      .attr('width', 160)
      .attr('height', 24)
      .attr('fill', 'var(--color-surface)')
      .attr('stroke', 'var(--color-border)');
    tooltip.append('text')
      .attr('x', 10)
      .attr('y', 17)
      .attr('fill', 'var(--color-text)');

    let tooltipVisible = false;
    let animationFrameId = null;
    const hideTooltip = () => {
      tooltipVisible = false;
      tooltip.style('display', 'none');
      verticalLine.style('display', 'none');
      otherVerticalLine.style('display', 'none');
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape' && tooltipVisible) {
        event.preventDefault();
        event.stopPropagation();
        hideTooltip();
      }
    };

    svg.on('mousemove', (event) => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        const [xPosition, yPosition] = pointer(event, svg.node());
        const year = yearAtPosition(xPosition);
        const found = data.find((item) => item.year === year);

        if (!found || yPosition > SVG_HEIGHT) {
          hideTooltip();
          return;
        }

        const tooltipWidth = 160;
        const tooltipHeight = 24;
        const xOffset = xPosition + tooltipWidth > containerWidth
          ? -tooltipWidth - 10
          : 10;
        const yOffset = yPosition + tooltipHeight > 200
          ? -tooltipHeight - 1
          : 1;

        tooltipVisible = true;
        verticalLine
          .style('display', null)
          .attr('x1', xPosition)
          .attr('x2', xPosition);
        otherVerticalLine.style('display', 'none');
        tooltip.select('text').text(`${year}: ${formatHitCount(found.doc_count)}`);
        tooltip
          .style('display', null)
          .attr(
            'transform',
            `translate(${xPosition + xOffset}, ${yPosition + yOffset})`,
          );
      });
    });

    svg.on('mouseleave', () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      hideTooltip();
    });
    document.addEventListener('keydown', handleEscape);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('keydown', handleEscape);
      svg.on('.drag', null).on('mousemove', null).on('mouseleave', null);
    };
  }, [
    containerRef,
    containerWidth,
    data,
    hasYearRange,
    onYearFilter,
    resetOnYearFilter,
    yearFilter,
  ]);

  useEffect(() => {
    const element = containerRef.current;
    let resizeObserver;

    if (element) {
      resizeObserver = new ResizeObserver(([entry]) => {
        setContainerWidth(entry.contentRect.width);
      });
      resizeObserver.observe(element);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [containerRef]);

  const validateYearRange = () => {
    const minYear = timelineStats?.firstYear;
    const maxYear = timelineStats?.lastYear;

    if (fromYearInput === '' || toYearInput === '') {
      return 'Ange både från år och till år.';
    }

    const fromYear = Number(fromYearInput);
    const toYear = Number(toYearInput);
    if (!Number.isInteger(fromYear) || !Number.isInteger(toYear)) {
      return 'Årtalen måste vara heltal.';
    }
    if (fromYear < minYear || fromYear > maxYear
      || toYear < minYear || toYear > maxYear) {
      return `Ange år mellan ${minYear} och ${maxYear}.`;
    }
    if (fromYear > toYear) {
      return 'Från år måste vara tidigare än eller samma som till år.';
    }

    return '';
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    const validationError = validateYearRange();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const fromYear = Number(fromYearInput);
    const toYear = Number(toYearInput);
    setFormError('');
    setFilterAnnouncement(`Visar sökträffar från år ${fromYear} till ${toYear}.`);
    onYearFilter(fromYear, toYear);
  };

  const handleFilterReset = () => {
    setFromYearInput('');
    setToYearInput('');
    setFormError('');
    setFilterAnnouncement('Årsfiltret har rensats.');
    resetOnYearFilter();
  };

  const inputDescription = formError
    ? `${instructionsId} ${formErrorId}`
    : instructionsId;

  return (
    <section
      className="mb-6 text-body"
      aria-labelledby={headingId}
      aria-describedby={`${instructionsId} ${summaryId}`}
      aria-busy={fetchStatus === 'loading'}
    >
      <p id={instructionsId} className="mb-2 text-sm text-muted">
        Varje stapel motsvarar ett år och stapelns höjd visar antalet sökträffar.
        Dra över diagrammet med musen eller ange ett årsintervall nedan för att
        filtrera sökresultatet.
      </p>
      <p id={summaryId} className="mb-3 text-sm text-body" aria-live="polite">
        {timelineSummary}
      </p>

      {fetchStatus === 'ready' && timelineStats && (
        <>
          <div className="mt-3 max-sm:hidden">
            <svg
              ref={svgRef}
              width={containerWidth}
              height={SVG_HEIGHT + 30}
              aria-hidden="true"
              focusable="false"
            />
          </div>

          <form className="mt-4" onSubmit={handleFilterSubmit} noValidate>
            <fieldset className="m-0 border-0 p-0">
              <legend className="sr-only">
                Filtrera sökträffar efter årsintervall
              </legend>
              <div className="flex flex-wrap items-end gap-3">
                <label
                  className="flex flex-col gap-1 text-sm font-semibold text-body"
                  htmlFor={fromYearInputId}
                >
                  Från år
                  <input
                    id={fromYearInputId}
                    type="number"
                    className="!mb-0 w-36 rounded-md border border-border bg-surface px-3 py-2 text-body focus:outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus"
                    min={timelineStats.firstYear}
                    max={timelineStats.lastYear}
                    step="1"
                    required
                    value={fromYearInput}
                    onChange={(event) => {
                      setFromYearInput(event.target.value);
                      setFormError('');
                    }}
                    aria-describedby={inputDescription}
                    aria-invalid={Boolean(formError)}
                  />
                </label>
                <label
                  className="flex flex-col gap-1 text-sm font-semibold text-body"
                  htmlFor={toYearInputId}
                >
                  Till år
                  <input
                    id={toYearInputId}
                    type="number"
                    className="!mb-0 w-36 rounded-md border border-border bg-surface px-3 py-2 text-body focus:outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus"
                    min={timelineStats.firstYear}
                    max={timelineStats.lastYear}
                    step="1"
                    required
                    value={toYearInput}
                    onChange={(event) => {
                      setToYearInput(event.target.value);
                      setFormError('');
                    }}
                    aria-describedby={inputDescription}
                    aria-invalid={Boolean(formError)}
                  />
                </label>
                <button
                  type="submit"
                  className="!mb-0 rounded-md border-2 border-transparent bg-primary px-4 py-2 !text-white hover:bg-primary-hover focus:outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Filtrera
                </button>
                <button
                  type="button"
                  className="!mb-0 rounded-md border border-border bg-surface px-4 py-2 text-body hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleFilterReset}
                  disabled={!hasYearRange && !hasDraftRange}
                >
                  Rensa
                </button>
              </div>
              {formError && (
                <p
                  id={formErrorId}
                  className="mt-2 text-sm text-danger"
                  role="alert"
                >
                  {formError}
                </p>
              )}
            </fieldset>
          </form>

          <div className="sr-only">
            <h3 id={dataHeadingId}>Diagramdata, år och antal sökträffar</h3>
            <ul aria-labelledby={dataHeadingId}>
              {data.map((item) => (
                <li key={item.year}>
                  {`År ${item.year}: ${formatHitCount(item.doc_count)}`}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {filterAnnouncement}
      </p>
    </section>
  );
}

Timeline.propTypes = {
  containerRef: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  filter: PropTypes.string.isRequired,
  yearFilter: PropTypes.arrayOf(PropTypes.number),
  mode: PropTypes.string.isRequired,
  onYearFilter: PropTypes.func.isRequired,
  resetOnYearFilter: PropTypes.func.isRequired,
};

export default Timeline;
