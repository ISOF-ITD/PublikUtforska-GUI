import React from 'react';

export default class AdvancedSearchBox extends React.Component {

    constructor(props) {
		super(props);
        this.state = {
			searchParams: {},
		};

        this.searchPersonRelationChangeHandler = this.searchPersonRelationChangeHandler.bind(this);
		this.searchRecordtypeChangeHandler = this.searchRecordtypeChangeHandler.bind(this);
		this.searchGenderChangeHandler = this.searchGenderChangeHandler.bind(this);
	}

    componentDidMount() {
		this.setState({
			searchParams: this.props.searchParams,
		})
	}

    searchPersonRelationChangeHandler(event) {
		if (event.target.value != this.state.searchParams.person_relation) {
			const searchParams = {...this.state.searchParams}
			searchParams.person_relation = event.target.value == 'both' ? '' : event.target.value
			this.setState({
				searchParams: searchParams,
			});
		}
        this.props.searchPersonRelationChangeHandler(event);
	}

	searchRecordtypeChangeHandler(event) {
		if (event.target.value != this.state.searchParams.recordtype) {
			const searchParams = {...this.state.searchParams}
			searchParams.recordtype = event.target.value == 'both' ? '' : event.target.value;
			this.setState({
				searchParams: searchParams,
			});
		}
        this.props.searchRecordtypeChangeHandler(event);
	}

	searchGenderChangeHandler(event) {
		if (event.target.value != this.state.searchParams.gender) {
			const searchParams = {...this.state.searchParams}
			searchParams.gender = event.target.value == 'both' ? '' : event.target.value
			this.setState({
				searchParams: searchParams,
			});
		}
        this.props.searchGenderChangeHandler(event);
	}

    render () {
        return (
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

                <button className="button-primary" onClick={this.props.executeSearch}>{l('Sök')}</button>

            </div>

        )
    }
}