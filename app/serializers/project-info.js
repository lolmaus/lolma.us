import ApplicationSerializer from './application'



export default ApplicationSerializer.extend({
  // ----- Overridden methods -----
  normalize (primaryModelClass, payload)  {
    const newPayload = {
      id:              payload.full_name,
      stargazersCount: payload.stargazers_count,
    }

    return this._super(primaryModelClass, newPayload)
  }
})
