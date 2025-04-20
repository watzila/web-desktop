using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Desktop.BLL.Interface;
using Desktop.Domain.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Desktop.Controllers {
	[Route ("api/[controller]")]
	[ApiController]
	[Produces("application/json")]
	public class CardController : BaseController {
		private readonly ICardService cardService;

		public CardController (ICardService cardService ) {
			this.cardService = cardService;
		}

		[HttpGet("GetCardList")]
		public List<CardModel> GetCardList ( ) {
			List<CardModel> result = cardService.GetList ( );
			return result;
		}

		[HttpPost ("GetCard")]
		public CardModel GetCard ( [FromBody]CardParamModel.GetCard value ) {
			CardModel result = cardService.GetCard (value);
			return result;
		}

		// POST api/<CardController>
		[HttpPost("CreateCard")]
		public IActionResult CreateCard ( [FromBody] CardParamModel.Item value ) {
			cardService.CreateCard (value);

			return Ok ("新增完成");
		}

		// PUT api/<CardController>/5
		[HttpPut ("{id}")]
		public void Put ( int id, [FromBody] string value ) {
		}

		// DELETE api/<CardController>/5
		[HttpDelete ("{id}")]
		public void Delete ( int id ) {
		}
	}
}
