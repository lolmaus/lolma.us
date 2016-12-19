import ApplicationSerializer from './application'



export default ApplicationSerializer.extend({
  extractRelationships (modelClass, resourceHash) {
    const projectId = resourceHash.id
    const owner     = resourceHash.owner || 'lolmaus'
    const id        = `${owner}/${projectId}`

    return {
      ...this._super(modelClass, resourceHash),
      projectInfo: {data: {id, type: 'project-info'}}
    }
  }
})
