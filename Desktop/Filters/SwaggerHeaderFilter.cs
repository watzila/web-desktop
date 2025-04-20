using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections.Generic;

namespace Desktop.Filters {
	public class SwaggerHeaderFilter : IOperationFilter {
		public void Apply ( OpenApiOperation operation, OperationFilterContext context ) {
			if ( operation.Parameters == null ) {
				operation.Parameters = new List<OpenApiParameter> ( );
			}
			operation.Parameters.Add (new OpenApiParameter {
				Name = "AppVersionCode",
				In = ParameterLocation.Header,
				Required = true,
				Schema = new OpenApiSchema {
					Type = "string",
					Default = new OpenApiString ("1.1.1"),
					ReadOnly=true
				}

			});
		}
	}
}
