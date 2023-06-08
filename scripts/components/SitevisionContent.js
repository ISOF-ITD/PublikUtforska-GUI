import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

const executeScripts = (scriptTags) => {
  _.each(scriptTags, (script) => {
    Function(script.innerHTML)();
  });
};

const fetchContent = async (url) => {
  url = url.replace('http://', 'https://');
  const headers = new Headers();
  headers.append('Content-Type', 'text/html');

  try {
    const response = await fetch(url, {
      method: 'get',
      headers,
    });
    const text = await response.text();
    return text;
  } catch (err) {
    console.log('fetch error', err);
  }
};

export default function SitevisionContent({ url, htmlContent, disableScriptExecution }) {
  const [content, setContent] = useState('');

  const parseHtml = useCallback(
    (html) => {
      const parser = new DOMParser();
      const document = parser.parseFromString(html, 'text/html');
      const mainElement = document.getElementsByClassName('pagecontent')[0];

      if (mainElement) {
        let content = mainElement.innerHTML;
        content = content.replace('src="/images/', `src="${config.isofHomepageUrl}images/`);
        content = content.replace('srcset="/images/', `srcset="${config.isofHomepageUrl}images/`);
        content = content.replace(', /images/', `, ${config.isofHomepageUrl}images/`);
        content = content.replace(', /images/', `, ${config.isofHomepageUrl}images/`);
        const scripts = mainElement.getElementsByTagName('script');

        setContent(content);
        if (!disableScriptExecution) {
          executeScripts(scripts);
        }
      }
    },
    [disableScriptExecution],
  );

  useEffect(() => {
    if (url) {
      fetchContent(url).then(parseHtml);
    } else if (htmlContent) {
      setContent(htmlContent);
    }
  }, [url, htmlContent, parseHtml]);

  return (
    <div className="sitevision-content">
      <div className="sv-fluid-grid main-grid" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

SitevisionContent.propTypes = {
  url: PropTypes.string,
  htmlContent: PropTypes.string,
  disableScriptExecution: PropTypes.bool,
};

SitevisionContent.defaultProps = {
  url: '',
  htmlContent: '',
  disableScriptExecution: false,
};

