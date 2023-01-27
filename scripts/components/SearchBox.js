import React from 'react';

import CategoryList from './CategoryList';
import { Route } from 'react-router-dom';
import routeHelper from './../utils/routeHelper';
import categories from './../../ISOF-React-modules/utils/utforskaCategories.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';

import config from '../config';

export default class SearchBox extends React.Component {
	constructor(props) {
		super(props);

		this.searchInputRef = React.createRef();
		this.suggestionsRef = React.createRef();

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.inputKeyPressHandler = this.inputKeyPressHandler.bind(this);
		this.searchValueChangeHandler = this.searchValueChangeHandler.bind(this);
		this.executeSearch = this.executeSearch.bind(this);
		this.clearSearch = this.clearSearch.bind(this);
		this.checkboxChangeHandler = this.checkboxChangeHandler.bind(this);
		this.categoryItemClickHandler = this.categoryItemClickHandler.bind(this);
		// this.suggestionClickHandler = this.suggestionClickHandler.bind(this);

		this.openButtonClickHandler = this.openButtonClickHandler.bind(this);
		this.openButtonKeyUpHandler = this.openButtonKeyUpHandler.bind(this);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);
		this.totalRecordsHandler = this.totalRecordsHandler.bind(this);

		this.suggestionClickHandler = this.suggestionClickHandler.bind(this);
		this.searchInputFocusHandler = this.searchInputFocusHandler.bind(this);
		this.searchInputBlurHandler = this.searchInputBlurHandler.bind(this);

		this.fetchingPageHandler = this.fetchingPageHandler.bind(this);

		// Lyssna efter event från eventBus som kommer om url:et ändras med nya sökparams

		this.state = {
			fetchingPage: false,
			searchSuggestions: [],
			suggestionsVisible: false,
			searchParams: {
				search: '',
				search_field: 'record',
			},
			totalRecords: {
				value: 0,
				relation: 'eq',
			}
			// searchSuggestions: [
			// 	'djävulen', 'Eskilsäter', 'Allahelgon'
			// ],
		};

		window.searchBox = this;
	}

	// filter keywords by search input value
	filteredSearchSuggestions() {
		return this.state.searchSuggestions.filter((keyword) => {
			return keyword.label.toLowerCase().indexOf(this.state.searchParams.search ? this.state.searchParams.search.toLowerCase() : '') > -1;
		});
	}

	getSearchSuggestions() {
		const path = config.matomoApiUrl;
        const params = config.searchSuggestionsParams;
        // add params to path
        const url = new URL(path);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        // read data from json api and store to window object
		fetch(url, {mode: 'cors'}).then(response => response.json()).then(data => {
			this.setState({
				searchSuggestions: data,
			});
		});
	}

	fetchingPageHandler(event) {
		this.setState({
			fetchingPage: event.target,
		});
	}

	inputKeyPressHandler(event) {
		// check if event.target is the search input that has the ref "searchInputRef"
		if (event.key == 'Enter' && (event.target === this.searchInputRef.current)) {
			this.executeSearch();
		}
		if (event.key === 'Enter' 
			&& this.suggestionsRef.current && this.suggestionsRef.current.contains(event.target)) {
			this.setState({
				suggestionsVisible: false,
				searchParams: {
					search: event.target.dataset.value					
					},
			}, () => this.executeSearch());
		}
		if (event.key == 'Escape') {
			this.setState({
				suggestionsVisible: false,	
			});
		}
		//if keydown and  this.suggestionsRef.current.contains(event.target)), change to next suggestion
		if (event.key == 'ArrowDown'
			&& this.suggestionsRef.current && this.suggestionsRef.current.contains(event.target)) {
			let next = event.target.nextElementSibling;
			if (next) {
				next.focus();
			}
		}
		//if keyup and  this.suggestionsRef.current.contains(event.target)), change to previous suggestion
		if (event.key == 'ArrowUp' 
			&& this.suggestionsRef.current && this.suggestionsRef.current.contains(event.target)) {
			let prev = event.target.previousElementSibling;
			if (prev) {
				prev.focus();
			}
		}
		// if keyup and (event.target === this.searchInputRef.current), change focus to first suggestion
		if (event.key == 'ArrowDown' && (event.target === this.searchInputRef.current)) {
			let first = this.suggestionsRef.current.firstElementChild;
			if (first) {
				first.focus();
			}
		}
		// if keydown and focus is on first suggestion, change focus to searchInputRef
		if (event.key == 'ArrowUp'
			&& this.suggestionsRef.current && this.suggestionsRef.current.contains(event.target)) {
			let first = this.suggestionsRef.current.firstElementChild;
			if (event.target === first) {
				this.searchInputRef.current.focus();
			}
		}
		// if any key except keydown, keyup, enter, escape is pressed, and this.suggestionsRef.current.contains(event.target)),
		// set focus to searchInputRef and add the character to the search input
		if (event.key != 'ArrowDown' && event.key != 'ArrowUp' && event.key != 'Enter' && event.key != 'Escape'
			&& this.suggestionsRef.current && this.suggestionsRef.current.contains(event.target)) {
			this.searchInputRef.current.focus();
		}
		
	}

	suggestionClickHandler(keyword) {
		this.setState({
			suggestionsVisible: false,
			searchParams: {
				search: keyword,
			}
		}, () => this.executeSearch());
	}

	// set suggestionsVisible to true when the search input is focused
	searchInputFocusHandler() {
		this.setState({
			suggestionsVisible: true,
		});
	}

	// set suggestionsVisible to false when the search input is blurred
	searchInputBlurHandler(event) {
		let close = !!this.suggestionsRef.current;
		close = close && event.relatedTarget !== this.searchInputRef.current && event.relatedTarget !== this.suggestionsRef.current;
		close = close && !this.suggestionsRef.current.contains(event.relatedTarget);
		if(close) {
			this.setState({
				suggestionsVisible: false,
			});
		}
	}

	categoryItemClickHandler(event) {
		// get the clicked category
		const selectedCategory = categories.categories[event.target.dataset.index].letter
		// derive already selected categories from the current searchParams
		let currentSelectedCategories = this.props.searchParams.category && this.props.searchParams.category.split(',')
		let selectedCategories = []
		// if the clicked category is part of the current search params, remove it from the current search params
		if (currentSelectedCategories && currentSelectedCategories.includes(selectedCategory)) {
			selectedCategories = currentSelectedCategories.filter(c => c !== selectedCategory)
		// else, check if list of current selected categories is not empty, then add the clicked category
		} else if (currentSelectedCategories) {
			selectedCategories = currentSelectedCategories
			selectedCategories.push(selectedCategory)
		// otherwise (no categories are in the search params), the new list of selected categories will a list with a single item, i.e. the clicked category
		} else {
			selectedCategories = [selectedCategory]
		}

		// create a new params object and change its category to the newly created list
		const params = {...this.state.searchParams}
		params['category'] = selectedCategories.join(',')
	
		//create a search route from the params object
		const path = "/places" + routeHelper.createSearchRoute(params)
	
		// set the route. All components that read from the route will change their state accordingly
		this.props.history.push(path);
	}

	executeSearch() {
		const params = {...this.props.searchParams}
		Object.assign(params, this.state.searchParams);
		// delete key "page" from params if it exists
		if (params.page) {
			delete params.page;
		}
		this.props.history.push(
			`/places${routeHelper.createSearchRoute(params)}
			${this.state.searchParams.search ? '?s='+this.state.searchParams.search : ''}`
			);
	}

	// Lägg nytt värde till state om valt värde ändras i sökfält, kategorilistan eller andra sökfält
	searchValueChangeHandler(event) {
		if (event.target.value != this.state.searchParams.search) {
			const searchParams = {...this.state.searchParams};
			searchParams.search = event.target.value;
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	clearSearch() {
		const searchParams = {...this.state.searchParams};
		searchParams.search = '';
		this.setState({
			searchParams: searchParams,
		});
		document.getElementById('searchInputMapMenu').value = '';
		document.getElementById('searchInputMapMenu').focus();
	}

	checkboxChangeHandler(event) {
		if(event.target.name === 'filter') {
			// for "Digitaliserat", "Avskrivet", "Allt"
			if (!this.state.searchParams[event.target.value]) {
				const searchParams = {...this.state.searchParams};
				searchParams['has_media'] = undefined;
				searchParams['has_transcribed_records'] = undefined;
				if(event.target.value !== 'all') {
					searchParams[event.target.value] = 'true';
				}
				this.setState({
					searchParams: searchParams,
				}, () => this.executeSearch());
			}
		} else {
			// for "Innehåll", "Person", "Ort"
			if (event.target.value != this.state.searchParams[event.target.name]) {
				const searchParams = {...this.state.searchParams};
				if(event.target.value === 'false') {
					searchParams[event.target.name] = undefined;
				} else {
					searchParams[event.target.name] = event.target.value;
				}
				this.setState({
					searchParams: searchParams,
				}, () => this.executeSearch());
			}
		}
	}

	languageChangedHandler() {
		// Gränssnitt tvingas uppdateras om språk ändras
		this.forceUpdate();
	}

	totalRecordsHandler(event) {
		this.setState({
			totalRecords: event.target
		});
	}

	componentDidMount() {
		// document.getElementById('app').addEventListener('click', this.windowClickHandler.bind(this));

		if (window.eventBus) {
			window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler);
			window.eventBus.addEventListener('recordList.totalRecords', this.totalRecordsHandler.bind(this));
			window.eventBus.addEventListener('recordList.fetchingPage', this.fetchingPageHandler.bind(this));
		}

		const searchParams = {...this.props.searchParams};
		// searchParams['search_field'] = searchParams['search_field'] || 'record';

		this.setState({
			searchParams: searchParams,
		})

		// populate search suggestions from matomo api
		this.getSearchSuggestions();
	}

	componentDidUpdate(prevProps) {
		if(JSON.stringify(prevProps.searchParams) !== JSON.stringify(this.props.searchParams)) {
		const searchParams = {...this.props.searchParams};
		// searchParams['search_field'] = searchParams['search_field'] || 'record';
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('Lang.setCurrentLang', this.languageChangedHandler)
		}
	}

	openButtonKeyUpHandler(event){
		if(event.keyCode == 13){
			this.openButtonClickHandler(event);
		} 
	}

	openButtonClickHandler() {
		if(window.eventBus) {
			window.eventBus.dispatch('routePopup.show');
		}
		// this.setState({
		// 	windowOpen: true,
		// 	manualOpen: true
		// });
	}

	render() {
		return (
			<div className={'search-box map-floating-control' + (this.props.expanded ? ' expanded' : '') + (this.state.searchParams.recordtype === 'one_record' ? ' advanced' : '')} >
				<div>
					<input id="searchInputMapMenu" ref={this.searchInputRef} type="text"
						defaultValue={this.state.searchParams.search ? this.state.searchParams.search : ''}
						// onChange={this.searchValueChangeHandler}
						onInput={this.searchValueChangeHandler}
						onKeyDown={this.inputKeyPressHandler}
						placeholder='Sök i Folke'
						onFocus={this.searchInputFocusHandler}
						onBlur={this.searchInputBlurHandler}
						aria-autocomplete='both'
						autoComplete='off'
						autoCorrect='off'
						autoCapitalize='off'
						spellCheck='false'
					/>

					<div 
						className="search-label"
						style={{
							'textOverflow': 'ellipsis',
							'overflow': 'hidden',
							'whiteSpace': 'nowrap',
							'maxWidth': 275,
							'display': 'block',
							}}
					>
						{
							!!this.state.searchParams.search ?
								(
									this.state.searchParams.search_field == 'record' ? 'Innehåll: ' :
										this.state.searchParams.search_field == 'person' ? 'Person: ' :
											this.state.searchParams.search_field == 'place' ? 'Ort: ' : ''
								) : l('Sök i Folke')
						}
						<strong>
							{
								this.state.searchParams.search ?
									this.state.searchParams.search : ''
							}
						</strong>
						{
							!!this.state.searchParams.has_media ? ' (Digitaliserat)' : ''
						}
						{
							!!this.state.searchParams.has_transcribed_records ? ' (Avskrivet)' : ''
						}
						{
							!!this.state.searchParams.transcriptionstatus ?
								(
									this.state.searchParams.transcriptionstatus == 'published' ? ' (Avskrivna)' : ' (För avskrift)'
								) : ''
						}
						<br/>
						<small>
						{
							this.state.searchParams.category ? 
							this.state.searchParams.category.split(',').map(
								(c) => categories.getCategoryName(c)
							).join(', ') : ''
						}
						</small>
					</div>
					{ this.state.suggestionsVisible && this.state.searchSuggestions.length > 0 &&
						// check if keywords filtered by search input value is not empty
						this.filteredSearchSuggestions().length > 0 &&
						// if true, show suggestions
						<div className="suggestions">
							<span className="suggestions-label">Vanligaste sökningar</span>
							<ul ref={this.suggestionsRef}>
								{
									// filter keywords by search input value
									this.filteredSearchSuggestions().slice(0, config.numberOfSearchSuggestions).map((keyword) => {
										return (
											<li
												className="suggestions-item"
												key={keyword.label}
												onClick={() => this.suggestionClickHandler(keyword.label)}
												tabIndex="0"
												onKeyDown={this.inputKeyPressHandler}
												data-value={keyword.label}
											>
												{/* make matching characters bold */}
												{
													keyword.label.split(new RegExp(`(${this.state.searchParams.search})`, 'gi')).map((part, i) => {
														return (
															<span
																key={i}
																style={{
																	fontWeight: part.toLowerCase() === (this.state.searchParams.search ? this.state.searchParams.search.toLowerCase() : '') ? 'bold' : 'normal'
																}}
															>
																{part}
															</span>
														)
													})
												}

											</li>
										)
									})
								}
							
							</ul>
						</div>
					}
				</div>
				<div className='search-field-buttons'>
					{/* only show clear button when there is text to clear */}
					{
						this.state.searchParams.search && <button className="clear-button" onClick={this.clearSearch}></button>
					}
					<button className="search-button" onClick={this.executeSearch}></button>
				</div>

				<div className="expanded-content">

					{/* <div className="search-suggestions">
						{
							this.state.searchSuggestions.map((suggestion, index) => {
								return (
									<div key={index} className="search-suggestion" onClick={this.suggestionClickHandler.bind(this, suggestion)}>
										{suggestion}
										</div>
								)
							})
						}


					</div> */}

					<div className="radio-group">

						<label>
							<input type="radio" value="record" onChange={this.checkboxChangeHandler} name="search_field" checked={this.state.searchParams.search_field == 'record' || !this.state.searchParams.search_field} />
						Innehåll
					</label>

						<label>
							<input type="radio" value="person" onChange={this.checkboxChangeHandler} name="search_field" checked={this.state.searchParams.search_field == 'person'} />
						Person
					</label>

						<label>
							<input type="radio" value="place" onChange={this.checkboxChangeHandler} name="search_field" checked={this.state.searchParams.search_field == 'place'} />
						Ort
					</label>

					</div>
					<hr/>
					{
						this.state.searchParams.recordtype == 'one_accession_row' &&
						<div className="radio-group">

							<label>
								<input type="radio" value="has_media" onChange={this.checkboxChangeHandler} name="filter" checked={this.state.searchParams.has_media === 'true'} />
								Digitaliserat
							</label>

							<label>
								<input type="radio" value="has_transcribed_records" onChange={this.checkboxChangeHandler} name="filter" checked={this.state.searchParams.has_transcribed_records === 'true'} />
								<span>Avskrivet</span>
							</label>

							<label>
								<input type="radio" value="all" onChange={this.checkboxChangeHandler} name="filter" checked={this.state.searchParams.has_media !== 'true' && this.state.searchParams.has_transcribed_records !== 'true'} />
								Allt
							</label>

						</div>
					}

					{	
						this.state.searchParams.recordtype == 'one_record' &&
						<div>
							<div className="radio-group">

								<label>
									<input type="radio" value="readytotranscribe" onChange={this.checkboxChangeHandler} name="transcriptionstatus" checked={this.state.searchParams.transcriptionstatus == 'readytotranscribe'} />
									För avskrift
								</label>

								<label>
									<input type="radio" value="published" onChange={this.checkboxChangeHandler} name="transcriptionstatus" checked={this.state.searchParams.transcriptionstatus == 'published'} />
									Avskrivet
								</label>

								<label>
									<input type="radio" value="false" onChange={this.checkboxChangeHandler} name="transcriptionstatus" checked={!this.state.searchParams.transcriptionstatus} />
									Allt
								</label>

							</div>
						</div>
					}

					{/* <hr /> */}

					{/* <button className="button-primary" onClick={this.executeSearch}>{l('Sök')}</button> */}

					<div className="advanced-content" style={{display: 'none'}}>
						<h4>Kategorier</h4>
						<div tabIndex={-1} className={'list-container minimal-scrollbar'}>
						<Route
							path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}
							render= {(props) =>
								<CategoryList 
									multipleSelect="true"
									searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
									itemClickHandler={this.categoryItemClickHandler}
									{...props}
								/>
							}
						/>
						</div>
					</div>
					{/* <button className="button-primary" onClick={this.executeSearch}>{l('Sök')}</button> */}
				</div>
				{
					!this.state.fetchingPage &&
					<div className="popup-wrapper">
						{
							this.state.totalRecords.value > 0 &&
							<a className="popup-open-button map-floating-control map-right-control visible ignore-expand-menu" onClick={this.openButtonClickHandler} onKeyUp={this.openButtonKeyUpHandler} tabIndex={0}>
								<strong className="ignore-expand-menu"><FontAwesomeIcon icon={faList} /> Visa {this.state.totalRecords.value}{this.state.totalRecords.relation === 'gte' ? '+': ''} sökträffar som lista</strong>
							</a>
						}
						{
							this.state.totalRecords.value === 0 &&
							<div className="popup-open-button map-floating-control map-right-control visible ignore-expand-menu" style={{cursor: 'unset'}}>
								<strong className="ignore-expand-menu">0 sökträffar</strong>
							</div>
						}
					</div>
				}
			</div>

		);
	}
}