import React from 'react';
import ReactDOM from 'react-dom';

import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';
import CategoryList from './CategoryList';

export default class SearchBox extends React.Component {
	constructor(props) {
		super(props);

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.inputKeyPressHandler = this.inputKeyPressHandler.bind(this);
		this.searchValueChangeHandler = this.searchValueChangeHandler.bind(this);
		this.searchFieldChangeHandler = this.searchFieldChangeHandler.bind(this);
		this.searchPersonRelationChangeHandler = this.searchPersonRelationChangeHandler.bind(this);
		this.searchGenderChangeHandler = this.searchGenderChangeHandler.bind(this);
		this.searchCategoriesChangeHandler = this.searchCategoriesChangeHandler.bind(this);
		this.searchButtonClickHandler = this.searchButtonClickHandler.bind(this);
		this.executeSimpleSearch = this.executeSimpleSearch.bind(this);
		this.searchBoxClickHandler = this.searchBoxClickHandler.bind(this);
		this.toggleAdvanced = this.toggleAdvanced.bind(this);
		this.itemKeyUpHandler = this.itemKeyUpHandler.bind(this);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);

		// Lyssna efter event från eventBus som kommer om url:et ändras med nya sökparams
		if (window.eventBus) {
			window.eventBus.addEventListener('application.searchParams', this.receivedSearchParams.bind(this))
		}

		this.state = {
			searchValue: '',
			searchField: 'record',
			includeNordic: false,
			expanded: false,
			advanced: false,
			searchCategories: []
		};

		window.searchBox = this;
	}

	inputKeyPressHandler(event) {
		if (event.key == 'Enter') {
			this.executeSimpleSearch();
		}
	}

	executeSimpleSearch() {
		// Lägg sökroute till url:et, kommer hanteras via router objected i app.js och skickas till MapView och RecordList
		// history.push('/places'
		// 	+(this.state.searchValue != '' ? '/search/'+this.state.searchValue+'/search_field/'+this.state.searchField : '')
		// 	+(this.state.includeNordic ? '/nordic/true' : ''));
		if (this.props.onSearch) {
			this.props.onSearch({
				searchValue: this.state.searchValue,
				searchField: this.state.searchField,
			});
		}
	}

	searchButtonClickHandler() {
		// Lägg mer komplicerad sökroute till url:et, kommer hanteras via router objected i app.js och skickas till MapView och RecordList
		history.push(
			'/places'+
			(
				this.state.searchValue != '' ?
					'/search/'+this.state.searchValue+
					'/search_field/'+this.state.searchField
				: ''
			)+
			(
				this.state.searchCategories.length > 0 ?
					'/category/'+this.state.searchCategories.join(';')
				: ''
			)+
			(
				this.state.searchPersonRelation != '' ?
					'/person_relation/'+this.state.searchPersonRelation
				: ''
			)+
			(
				this.state.searchGender != '' ?
					'/gender/'+this.state.searchGender
				: ''
			)
		);
	}

	// Lägg nytt värde till state om valt värde ändras i sökfält, kategorilisten eller andra sökfält
	searchValueChangeHandler(event) {
		if (event.target.value != this.state.searchValue) {
			this.setState({
				searchValue: event.target.value
			});
		}
	}

	searchFieldChangeHandler(event) {
		if (event.target.value != this.state.searchField) {
			this.setState({
				searchField: event.target.value
			});
		}
	}

	searchPersonRelationChangeHandler(event) {
		if (event.target.value != this.state.searchPersonRelation) {
			this.setState({
				searchPersonRelation: event.target.value == 'both' ? '' : event.target.value
			});
		}
	}

	searchGenderChangeHandler(event) {
		if (event.target.value != this.state.searchGender) {
			this.setState({
				searchGender: event.target.value == 'both' ? '' : event.target.value
			});
		}
	}

	searchCategoriesChangeHandler(event) {
		this.setState({
			searchCategories: event
		});
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

	receivedSearchParams(event) {
		// Fick parametrar från eventBus, uppdaterar sökfält
		this.setState({
			searchValue: event.target.searchValue || '',
			searchField: event.target.searchField || 'record',
			searchYearFrom: event.target.searchYearFrom,
			searchYearTo: event.target.searchYearTo,
			searchPersonRelation: event.target.searchPersonRelation || '',
			searchGender: event.target.searchGender || '',
			includeNordic: event.target.includeNordic
		});
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
					value={this.state.searchValue} 
					onChange={this.searchValueChangeHandler} 
					onKeyPress={this.inputKeyPressHandler} />
				
				<div className="search-label">
					{
						this.state.searchValue != '' ?
						(
							this.state.searchField == 'record' ? 'Innehåll: ' :
							this.state.searchField == 'person' ? 'Person: ' :
							this.state.searchField == 'place' ? 'Ort: ' : ''
						) : l('Sök')
					}
					<strong>
						{
							this.state.searchValue != '' ?
							this.state.searchValue : ''
						}
					</strong>
				</div>

				<button className="search-button" onClick={this.executeSimpleSearch}></button>

				<div className="expanded-content">

					<div className="radio-group">

						<label>
							<input type="radio" value="record" onChange={this.searchFieldChangeHandler} name="search-field" checked={this.state.searchField == 'record'} />
							Innehåll
						</label>

						<label>
							<input type="radio" value="person" onChange={this.searchFieldChangeHandler} name="search-field" checked={this.state.searchField == 'person'} />
							Person
						</label>

						<label>
							<input type="radio" value="place" onChange={this.searchFieldChangeHandler} name="search-field" checked={this.state.searchField == 'place'} />
							Ort
						</label>

					</div>

					<a  tabIndex={0} className="advanced-button" onClick={this.toggleAdvanced} onKeyUp={this.itemKeyUpHandler}>Avancerad sökning</a>

					<div className="advanced-content">

						<hr/>

						<h4>Kategorier</h4>
						<DropdownMenu label="Avgränsa till kategorier">
							<CategoryList multipleSelect="true" onChange={this.searchCategoriesChangeHandler} />
						</DropdownMenu>

						<hr/>

						<h4>Roll</h4>
						<div className="radio-group">
						
							<label>
								<input type="radio" value="c" onChange={this.searchPersonRelationChangeHandler} name="search-person-relation" checked={this.state.searchPersonRelation == 'c'} />
								Upptecknare
							</label>

							<label>
								<input type="radio" value="i" onChange={this.searchPersonRelationChangeHandler} name="search-person-relation" checked={this.state.searchPersonRelation == 'i'} />
								Meddelare
							</label>

							<label>
								<input type="radio" value="both" onChange={this.searchPersonRelationChangeHandler} name="search-person-relation" checked={this.state.searchPersonRelation == ''} />
								Båda
							</label>

						</div>

						<hr/>

						<h4>Kön</h4>
						<div className="radio-group">
						
							<label>
								<input type="radio" value="k" onChange={this.searchGenderChangeHandler} name="search-gender" checked={this.state.searchGender == 'k'} />
								Kvinna
							</label>

							<label>
								<input type="radio" value="m" onChange={this.searchGenderChangeHandler} name="search-gender" checked={this.state.searchGender == 'm'} />
								Man
							</label>

							<label>
								<input type="radio" value="both" onChange={this.searchGenderChangeHandler} name="search-gender" checked={this.state.searchGender == ''} />
								Båda
							</label>

						</div>

						<hr/>

						<button className="button-primary" onClick={this.searchButtonClickHandler}>{l('Sök')}</button>

					</div>

				</div>
			</div>
		);
	}
}