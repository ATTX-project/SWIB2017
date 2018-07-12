import React from 'react';
import {
  Button, Container, Grid, Header, Icon, Image, Item, Label, Menu, Segment, Step, Table,
} from 'semantic-ui-react'
import IframeComm from 'react-iframe-comm';
var jsonld = require('jsonld');

const request = require('superagent');




class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
          workflows: [
            {
              id: '1',
              title: 'sample workflow'
            }
          ],
          workflowExecutions: [],
          vis: '',
          attributes: {
              src: "",
              width: "100%",
              height: "600",
              frameBorder: 1, // show frame border just for fun...
          },
          update: 1
    };
    this.listWorkflows();
  }
  listWorkflows = () => {
    request
      .get('http://localhost:9210/attx/_search')
      .query({ q: '@type:WorkflowExecution' }) // query string
      .end((err, res) => {
        var data = res.body;
        var execs = [];
        var temp = {}
        data.hits.hits.map(hit => {
            var plan = hit._source['http://www.w3.org/ns/prov#qualifiedAssociation']['http://www.w3.org/ns/prov#hadPlan']['@id']
            //var label = hit._source['http://www.w3.org/ns/prov#qualifiedAssociation']['http://www.w3.org/ns/prov#hadPlan']['http://www.w3.org/2000/01/rdf-schema#label']
            var label = hit._source['http://purl.org/dc/terms/title']
            var exec = plan.substring(plan.lastIndexOf('/') + 1);

            plan = plan.substring(0, plan.lastIndexOf('_'));
            console.log(plan);
            console.log(exec);

            if(plan in temp) {
              temp[plan].execs.push(exec);
            }
            else {
              execs.push();
              temp[plan] = {
                id: plan,
                title: label.substring(0 , label.lastIndexOf(' ')),
                execs: [exec]
              };

            }
            console.log(temp);

        })
        Object.keys(temp).map(function(key, index) {
           execs.push(temp[key]);
        });
        // add results to the freezer
        this.setState({'workflows': execs});
        console.log(execs);
      });
  }

  listWorkflowExecutions = (workflowID) => {
    console.log(workflowID);
    var q = '';
    this.state.workflows.map(w => {
      if(w.id == workflowID) {
        q = w.execs[0];
        if(w.execs.length > 1) {
          for(var i = 1; i < w.execs.length; i++) {
            q = q + ' || ' + w.execs[i];
          }
        }
      }
    });
    console.log(q);
    request
      .get('http://localhost:9210/attx/_search')
      .query({ q: q }) // query string
      .end((err, res) => {
        var data = res.body;
        var execs = [];
        data.hits.hits.map(hit => {
            var id = hit._id;
            var title = hit._source['http://purl.org/dc/terms/title'];
            var status = hit._source['http://data.hulib.helsinki.fi/attx/onto#hasStatus'];
            var startTime = hit._source['http://www.w3.org/ns/prov#startedAtTime']['@value'];
            var endTime = hit._source['http://www.w3.org/ns/prov#endedAtTime']['@value'];

            execs.push( {
              id: id,
              title: title,
              status: status,
              startTime: startTime,
              endTime: endTime
            });
        })

        // add results to the freezer
        this.setState({'workflowExecutions': execs});
        console.log(execs);
      });
  }
  handleWorkflowClick = (id) => {
    this.listWorkflowExecutions(id);

  }

  update = (e) => {

    request
      .get('http://localhost:4301/provjob')
      .end((err, res) => {
        window.setTimeout(function() {
          request
            .post('http://localhost:7030/0.2/index/prov')
            .end((err, res) => {
              console.log('update done');
              var u = this.state.update;
              u = u + 1;
              this.setState(
                {update: u}
              );
            }
          );
        }, 3000);
      })

  }

  showPipelines = (e) => {

    self = this;
    request
      .get('http://localhost:9210/attx/_search?q=workflowexecution')
      .query({'size': 100})
      .end((err, res) => {
        var docs = []
        res.body.hits.hits.map(hit => {
          docs.push(hit._source);
        })
        var doc = {
          '@graph': docs
        };
        //console.log(doc);
        jsonld.toRDF(doc, {format: 'application/nquads'}, function(err, data) {
          //console.log(data);

          self.setState({
attributes : {
    src: "http://localhost:5000/",
    width: "100%",
    height: "600",
    frameBorder: 1, // show frame border just for fun...
},
            rdf: data});
        });
    });
  }

  handleWorkflowExecutionClick = (id) => {
    console.log(id);
    var docType = id.substring(id.lastIndexOf('/'));
    docType = docType.substring(1, docType.lastIndexOf('_'));
    console.log(docType);
    self = this;
    request
      .get('http://localhost:9210/attx/' + docType + '/_search')
      .query({'size': 100})
      .end((err, res) => {
        var docs = []
        res.body.hits.hits.map(hit => {
          docs.push(hit._source);
        })
        var doc = {
          '@graph': docs
        };
        //console.log(doc);
        jsonld.toRDF(doc, {format: 'application/nquads'}, function(err, data) {
          //console.log(data);

          self.setState({
attributes : {
    src: "http://localhost:5000/",
    width: "100%",
    height: "600",
    frameBorder: 1, // show frame border just for fun...
},
            rdf: data});
        });
    });
  }



  render() {

    return (
      <div>
        <Header as='h1' content='Provenance browser PoC' textAlign='center'/>
        <Grid container columns={2} stackable>
          <Grid.Row>
            <Grid.Column>
              <Table celled striped>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell colSpan='3'>Workflows </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {this.state.workflows.map( wf => (
                    <Table.Row key={wf.id}>
                      <Table.Cell onClick={this.handleWorkflowClick.bind(this, wf.id)}>{wf.title}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
              <Button onClick={this.showPipelines}>Show pipelines</Button>



            </Grid.Column>
            <Grid.Column>
              <Table celled striped>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell colSpan='3'>Workflow executions </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {this.state.workflowExecutions.map( wf => (
                    <Table.Row key={wf.id}>
                      <Table.Cell onClick={this.handleWorkflowExecutionClick.bind(this, wf.id)}>{wf.startTime}:{wf.endTime}<div>{wf.status}</div></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Segment>
        <IframeComm
            attributes={this.state.attributes}
            postMessageData={this.state.rdf}

        />
        </Segment>
      </div>
    )
  }
}

export default Home;
