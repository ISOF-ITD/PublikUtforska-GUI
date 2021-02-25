import React from 'react';
import ReactDOM from 'react-dom';

import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';
import CategoryList from './CategoryList';

import routeHelper from './../utils/routeHelper'

export default class SearchBox extends React.Component {
	constructor(props) {
		super(props);

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.inputKeyPressHandler = this.inputKeyPressHandler.bind(this);
		this.searchValueChangeHandler = this.searchValueChangeHandler.bind(this);
		this.searchFieldChangeHandler = this.searchFieldChangeHandler.bind(this);
		this.searchPersonRelationChangeHandler = this.searchPersonRelationChangeHandler.bind(this);
		this.searchRecordtypeChangeHandler = this.searchRecordtypeChangeHandler.bind(this);
		this.searchGenderChangeHandler = this.searchGenderChangeHandler.bind(this);
		// this.searchCategoriesChangeHandler = this.searchCategoriesChangeHandler.bind(this);
		// this.searchButtonClickHandler = this.searchButtonClickHandler.bind(this);
		this.executeSearch = this.executeSearch.bind(this);
		this.searchBoxClickHandler = this.searchBoxClickHandler.bind(this);
		this.toggleAdvanced = this.toggleAdvanced.bind(this);
		this.itemKeyUpHandler = this.itemKeyUpHandler.bind(this);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);

		// Lyssna efter event från eventBus som kommer om url:et ändras med nya sökparams

		this.state = {
			searchParams: {
				search: '',
				search_field: 'record',
			},
			expanded: false,
			advanced: false,
		};

		window.searchBox = this;
	}

	inputKeyPressHandler(event) {
		if (event.key == 'Enter') {
			this.executeSearch();
		}
	}

	executeSearch() {
		const params = {...this.props.searchParams}
		params['search'] = this.state.searchParams.search
		params['search_field'] = this.state.searchParams.search_field
		params['category'] = this.state.searchParams.category
		params['recordtype'] = this.state.searchParams.recordtype
		params['person_relation'] = this.state.searchParams.person_relation
		params['gender'] = this.state.searchParams.gender
		this.props.history.push(
			'/places'
			+ routeHelper.createSearchRoute(params)
			);
	}

	// searchButtonClickHandler() {
	// 	this.executeSearch()
	// }

	// Lägg nytt värde till state om valt värde ändras i sökfält, kategorilisten eller andra sökfält
	searchValueChangeHandler(event) {
		if (event.target.value != this.state.searchParams.search) {
			const searchParams = {...this.state.searchParams}
			searchParams.search = event.target.value
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	searchFieldChangeHandler(event) {
		if (event.target.value != this.state.searchParams.search_field) {
			const searchParams = {...this.state.searchParams}
			searchParams.search_field = event.target.value
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	searchPersonRelationChangeHandler(event) {
		if (event.target.value != this.state.searchParams.person_relation) {
			const searchParams = {...this.state.searchParams}
			searchParams.person_relation = event.target.value == 'both' ? '' : event.target.value
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	searchRecordtypeChangeHandler(event) {
		if (event.target.value != this.state.searchParams.recordtype) {
			const searchParams = {...this.state.searchParams}
			searchParams.recordtype = event.target.value == 'both' ? '' : event.target.value;
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	searchGenderChangeHandler(event) {
		if (event.target.value != this.state.searchParams.gender) {
			const searchParams = {...this.state.searchParams}
			searchParams.gender = event.target.value == 'both' ? '' : event.target.value
			this.setState({
				searchParams: searchParams,
			});
		}
	}

	searchBoxClickHandler() {
		if (!this.state.expanded) {
			this.setState({
				expanded: true
			}, function() {
				if (this.props.onSizeChange) {
					this.props.onSizeChange(this.state)
				}
			}.bind(this));
			
			this.refs.searchInput.focus();
		}

	}

	itemKeyUpHandler(event){
		if(event.keyCode == 13){
			this.toggleAdvanced();
		} 
	}

	toggleAdvanced() {
		this.setState({
			advanced: !this.state.advanced
		}, function() {
			if (this.props.onSizeChange) {
				this.props.onSizeChange(this.state)
			}
		}.bind(this));
	}

	languageChangedHandler() {
		// Gränssnitt tvingas uppdateras om språk ändras
		this.forceUpdate();
	}

	componentDidMount() {
		document.getElementById('app').addEventListener('click', this.windowClickHandler.bind(this));

		if (window.eventBus) {
			window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler)
		}

		const searchParams = {...this.props.searchParams};
		searchParams['search_field'] = searchParams['search_field'] || 'record';

		this.setState({
			searchParams: searchParams
		})
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('Lang.setCurrentLang', this.languageChangedHandler)
		}
	}

	windowClickHandler(event) {
		var componentEl = ReactDOM.findDOMNode(this.refs.container);

		if (!!componentEl && !componentEl.contains(event.target) && !this.state.advanced) {
			this.setState({
				expanded: false
			}, function() {
				if (this.props.onSizeChange) {
					this.props.onSizeChange(this.state)
				}
			}.bind(this));
		}
	}

	render() {
		return (
			<div ref="container" 
				onClick={this.searchBoxClickHandler} 
				className={'search-box map-floating-control'+(this.state.expanded ? ' expanded' : '')+(this.state.advanced ? ' advanced' : '')} >
				<input ref="searchInput" type="text"
					value={this.state.searchParams.search}
					onChange={this.searchValueChangeHandler}
					onKeyPress={this.inputKeyPressHandler}
				/>
				
				<div className="search-label">
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
							this.state.searchParams.search != '' ?
							this.state.searchParams.search : ''
						}
					</strong>
				</div>

				<button className="search-button" onClick={this.executeSearch}></button>

				<div className="expanded-content">

					<div className="radio-group">

						<label>
							<input type="radio" value="record" onChange={this.searchFieldChangeHandler} name="search-field" checked={this.state.searchParams.search_field == 'record'} />
							Innehåll
						</label>

						<label>
							<input type="radio" value="person" onChange={this.searchFieldChangeHandler} name="search-field" checked={this.state.searchParams.search_field == 'person'} />
							Person
						</label>

						<label>
							<input type="radio" value="place" onChange={this.searchFieldChangeHandler} name="search-field" checked={this.state.searchParams.search_field == 'place'} />
							Ort
						</label>

					</div>

					<a  tabIndex={0} className="advanced-button" onClick={this.toggleAdvanced} onKeyUp={this.itemKeyUpHandler}>Avancerad sökning</a>

					<div className="advanced-content">

						<hr/>

						<h4>Record Type</h4>
						<div className="radio-group">
						
							<label>
								<input type="radio" value="one_accession_row" onChange={this.searchRecordtypeChangeHandler} name="search-recordtype" checked={this.state.searchParams.recordtype == 'one_accession_row'} />
								one_accession_row
							</label>

							<label>
								<input type="radio" value="one_record" onChange={this.searchRecordtypeChangeHandler} name="search-recordtype" checked={this.state.searchParams.recordtype == 'one_record'} />
								one_record
							</label>

							<label>
								<input type="radio" value="both" onChange={this.searchRecordtypeChangeHandler} name="search-recordtype" checked={!this.state.searchParams.recordtype} />
								Båda
							</label>

						</div>

						<h4>Roll</h4>
						<div className="radio-group">
						
							<label>
								<input type="radio" value="c" onChange={this.searchPersonRelationChangeHandler} name="search-person-relation" checked={this.state.searchParams.person_relation == 'c'} />
								Upptecknare
							</label>

							<label>
								<input type="radio" value="i" onChange={this.searchPersonRelationChangeHandler} name="search-person-relation" checked={this.state.searchParams.person_relation == 'i'} />
								Meddelare
							</label>

							<label>
								<input type="radio" value="both" onChange={this.searchPersonRelationChangeHandler} name="search-person-relation" checked={!this.state.searchParams.person_relation} />
								Båda
							</label>

						</div>

						<hr/>

						<h4>Kön</h4>
						<div className="radio-group">
						
							<label>
								<input type="radio" value="female" onChange={this.searchGenderChangeHandler} name="search-gender" checked={this.state.searchParams.gender == 'female'} />
								Kvinna
							</label>

							<label>
								<input type="radio" value="male" onChange={this.searchGenderChangeHandler} name="search-gender" checked={this.state.searchParams.gender == 'male'} />
								Man
							</label>

							<label>
								<input type="radio" value="both" onChange={this.searchGenderChangeHandler} name="search-gender" checked={!this.state.searchParams.gender} />
								Båda
							</label>

						</div>

						<hr/>

						<button className="button-primary" onClick={this.executeSearch}>{l('Sök')}</button>

					</div>

				</div>
			</div>
		);
	}
}