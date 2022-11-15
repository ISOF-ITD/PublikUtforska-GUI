import React from 'react';

import CategoryList from './CategoryList';
import { Route } from 'react-router-dom';
import routeHelper from './../utils/routeHelper';
import categories from './../../ISOF-React-modules/utils/utforskaCategories.js';

export default class SearchBox extends React.Component {
	constructor(props) {
		super(props);

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.inputKeyPressHandler = this.inputKeyPressHandler.bind(this);
		this.searchValueChangeHandler = this.searchValueChangeHandler.bind(this);
		this.executeSearch = this.executeSearch.bind(this);
		this.searchBoxClickHandler = this.searchBoxClickHandler.bind(this);
		this.checkboxChangeHandler = this.checkboxChangeHandler.bind(this);
		this.categoryItemClickHandler = this.categoryItemClickHandler.bind(this);
		// this.suggestionClickHandler = this.suggestionClickHandler.bind(this);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);

		// Lyssna efter event från eventBus som kommer om url:et ändras med nya sökparams

		this.state = {
			searchParams: {
				search: '',
				search_field: 'record',
			},
			// searchSuggestions: [
			// 	'djävulen', 'Eskilsäter', 'Allahelgon'
			// ],
		};

		window.searchBox = this;
	}

	// suggestionClickHandler(event) {
	// 	this.setState({
	// 		searchParams: {
	// 			search: event.target.innerHTML,	
	// 		}
	// 	}, () => this.executeSearch());
	// }
	

	inputKeyPressHandler(event) {
		if (event.key == 'Enter') {
			this.executeSearch();
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



	searchBoxClickHandler() {	
		this.refs.searchInput.focus();
	}

	languageChangedHandler() {
		// Gränssnitt tvingas uppdateras om språk ändras
		this.forceUpdate();
	}

	componentDidMount() {
		// document.getElementById('app').addEventListener('click', this.windowClickHandler.bind(this));

		if (window.eventBus) {
			window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler)
		}

		const searchParams = {...this.props.searchParams};
		// searchParams['search_field'] = searchParams['search_field'] || 'record';

		this.setState({
			searchParams: searchParams,
		})
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

	render() {
		return (
			<div
				onClick={this.searchBoxClickHandler}
				className={'search-box map-floating-control' + (this.props.expanded ? ' expanded' : '') + (this.state.searchParams.recordtype === 'one_record' ? ' advanced' : '')} >
				<input ref="searchInput" type="text"
					defaultValue={this.state.searchParams.search ? this.state.searchParams.search: ''}
					// onChange={this.searchValueChangeHandler}
					onInput={this.searchValueChangeHandler}
					onKeyPress={this.inputKeyPressHandler}
					placeholder='Sök'
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
							) : l('Sök')
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

				<button className="search-button" onClick={this.executeSearch}></button>

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
			</div>

		);
	}
}